// server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import neo4j from "neo4j-driver";

// __dirname replacement (karena ESM tidak ada __dirname langsung)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// Koneksi ke Neo4j dengan integer handling
const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("neo4j", "12345678"),
  { disableLosslessIntegers: true }
);

// Contoh static serving
app.use(express.static(path.join(__dirname, "public")));

// Fungsi utilitas
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterPoints(points, threshold = 0.07) {
  const filteredPoints = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prevPoint = filteredPoints[filteredPoints.length - 1];
    const currentPoint = points[i];
    const distance = calculateDistance(
      prevPoint.latitude,
      prevPoint.longitude,
      currentPoint.latitude,
      currentPoint.longitude
    );
    if (distance > threshold) filteredPoints.push(currentPoint);
  }
  return filteredPoints;
}

app.get('/get-data', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (n)-[r]->(m)
            RETURN n, m, r
        `);

        const data = result.records.map(record => ({
            source: {
                id: record.get('n').properties.id,
                nama: record.get('n').properties.nama,
                latitude: parseFloat(record.get('n').properties.latitude),
                longitude: parseFloat(record.get('n').properties.longitude),
                jenis: record.get('n').properties.jenis,
            },
            target: {
                id: record.get('m').properties.id,
                nama: record.get('m').properties.nama,
                latitude: parseFloat(record.get('m').properties.latitude),
                longitude: parseFloat(record.get('m').properties.longitude),
                jenis: record.get('m').properties.jenis,
            },
            relationship: {
                jarak_tempuh: parseFloat(record.get('r').properties.jarak_tempuh),
                waktu_tempuh: parseFloat(record.get('r').properties.waktu_tempuh),
                jenis: record.get('r').properties.jenis || null 
            },
        }));

        for (const d of data) {
            if (!d.source.id || !d.target.id) continue;
            
            const resultPerantara = await session.run(`
                MATCH (source)-[:Menuju]->(titik)-[:Menuju]->(target)
                WHERE source.id = $sourceId AND target.id = $targetId
                RETURN titik.id AS titikId, 
                       titik.latitude AS latitude, 
                       titik.longitude AS longitude, 
                       titik.jenis AS jenis
                ORDER BY titikId
            `, { sourceId: d.source.id, targetId: d.target.id });

            const pointsFromDb = resultPerantara.records.map(record => ({
                id: record.get('titikId'),
                latitude: parseFloat(record.get('latitude')),
                longitude: parseFloat(record.get('longitude')),
                jenis: record.get('jenis'),
            }));

            const points = [d.source, ...pointsFromDb, d.target];
            d.filteredPath = filterPoints(points, 0.07);
        }

        res.json(data);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}); 


app.get('/shortest-path', async (req, res) => {
     const session = driver.session();
    const { start, end } = req.query;
    
    if (!start || !end) {
        return res.status(400).json({ 
            error: "Parameter start dan end harus diisi!" 
        });
    }

    try {
        const dijkstraResult = await session.run(`
            MATCH (source:Koordinat {id_rute: $start}), 
                  (target:Koordinat {id_rute: $end})
            CALL gds.shortestPath.dijkstra.stream(
                'myGraph',
                {
                    sourceNode: id(source),
                    targetNode: id(target),
                    relationshipWeightProperty: 'jarak_tempuh'
                }
            )
            YIELD path, totalCost, nodeIds
            RETURN path, totalCost, nodeIds
        `, { 
            start: neo4j.int(Number(start)), 
            end: neo4j.int(Number(end)) 
        });

        if (dijkstraResult.records.length === 0) {
            return res.status(404).json({ error: "Rute tidak ditemukan" });
        }

        const record = dijkstraResult.records[0];
        const nodeIds = record.get('nodeIds');
        const totalCost = record.get('totalCost');

        const allNodesResult = await session.run(`
            UNWIND $nodeIds AS nodeId
            MATCH (n) WHERE id(n) = nodeId
            RETURN 
                id(n) AS internalId,
                n.id_rute AS id,
                n.nama AS nama,
                n.latitude AS latitude,
                n.longitude AS longitude,
                n.jenis AS jenis
            ORDER BY apoc.coll.indexOf($nodeIds, id(n))
        `, { nodeIds });

        const allNodes = allNodesResult.records.map(r => ({
            internalId: r.get('internalId').toNumber ? r.get('internalId').toNumber() : r.get('internalId'),
            id: r.get('id'),
            nama: r.get('nama'),
            latitude: parseFloat(r.get('latitude')),
            longitude: parseFloat(r.get('longitude')),
            jenis: r.get('jenis')
        }));

        const mainNodeIndices = [];
        allNodes.forEach((node, idx) => {
            if (node.jenis !== 'titik') mainNodeIndices.push(idx);
        });

        async function getRelasiByInternalId(sourceInternalId, targetInternalId) {
            const relResult = await session.run(`
                MATCH (a)-[r]->(b)
                WHERE id(a) = $sourceId AND id(b) = $targetId
                RETURN r.jarak_tempuh AS jarak_tempuh, r.waktu_tempuh AS waktu_tempuh, r.moda AS moda, r.nomor_trayek AS nomor_trayek
                LIMIT 1
            `, { sourceId: neo4j.int(sourceInternalId), targetId: neo4j.int(targetInternalId) });

            if (relResult.records.length > 0) {
                const rel = relResult.records[0];
                return {
                    jarak_tempuh: rel.get('jarak_tempuh') || 0,
                    waktu_tempuh: rel.get('waktu_tempuh') || 0,
                    moda: rel.get('moda') || 'tidak diketahui',
                    nomor_trayek: rel.get('nomor_trayek') || null
                };
            }
            
            return null;
        }

        let steps = [];

        for (let i = 0; i < mainNodeIndices.length - 1; i++) {
            const startIdx = mainNodeIndices[i];
            const endIdx = mainNodeIndices[i + 1];

            let totalJarak = 0;
            let totalWaktu = 0;
            let moda = null;
            let nomor_trayek = null;

            for (let j = startIdx; j < endIdx; j++) {
                const sourceNode = allNodes[j];
                const targetNode = allNodes[j + 1];

                const rel = await getRelasiByInternalId(sourceNode.internalId, targetNode.internalId);
                if (rel) {
                    totalJarak += rel.jarak_tempuh;
                    totalWaktu += rel.waktu_tempuh;
                    if (!moda) moda = rel.moda;
                    if (!nomor_trayek) nomor_trayek = rel.nomor_trayek;
                }
            }

            steps.push({
                start: allNodes[startIdx].nama,
                end: allNodes[endIdx].nama,
                moda: moda || 'tidak diketahui',
                nomor_trayek: nomor_trayek,
                jarak_tempuh: totalJarak,
                waktu_tempuh: totalWaktu
            });
        }

        function generateInstructions(steps) {
            const instructions = [];
            let currentModa = null;
            let currentNomor = null;

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i];
                const prevStep = i > 0 ? steps[i - 1] : null;

                if (!prevStep || step.moda !== currentModa || step.nomor_trayek !== currentNomor) {
                    instructions.push(`Naik ${step.moda}${step.nomor_trayek ? ' Nomor ' + step.nomor_trayek : ''} di Halte ${step.start}`);
                    currentModa = step.moda;
                    currentNomor = step.nomor_trayek;
                }

                instructions.push(`Turun ${step.moda} di Halte ${step.end}`);

                if (i === steps.length - 1 && step.moda.toLowerCase() !== 'jalan kaki') {
                    instructions.push(`Jalan kaki ke ${step.end}`);
                }
            }
            return instructions;
        }

        const instructions = generateInstructions(steps);

        res.json({
            path: allNodes,
            totalCost: Number(totalCost),
            steps,
            instructions
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: "Kesalahan server",
            detail: error.message 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/get-halte', async (req, res) => {
    const session = driver.session();
    const kategori = req.query.kategori;

    let query = "";
    let params = {};

    if (kategori === 'tujuan') {
        query = `
            MATCH (n:Koordinat)
            WHERE n.kategori = $kategori
            RETURN n.id_rute AS id_rute, n.nama AS nama
            ORDER BY n.nama
        `;
        params = { kategori };
    } else if (kategori === 'Asal') {
        query = `
            MATCH (n:Koordinat)
            WHERE NOT n.jenis IN ['titik', 'mall', 'pasar', 'wisata', 'rumahsakit']
            RETURN n.id_rute AS id_rute, n.nama AS nama
            ORDER BY n.jenis
        `;
    } else {
        return res.status(400).json({ error: 'Kategori tidak dikenali' });
    }

    try {
        const result = await session.executeRead(tx =>
            tx.run(query, params)
        );

        const halte = result.records.map(record => ({
            id_rute: record.get('id_rute'),
            nama: record.get('nama')
        }));

        res.json(halte);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "Gagal mengambil data halte" });
    } finally {
        await session.close();
    }
});


app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
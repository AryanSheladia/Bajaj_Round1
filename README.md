# Bajaj Round 1 — Graph Hierarchy Analyzer

REST API + Frontend for processing directed graph edges, detecting cycles, and building tree hierarchies.

## API

**POST** `/api/graph`

```json
{ "edges": ["A->B", "A->C", "B->D"] }
```

Returns structured hierarchy data with cycle detection, depth calculation, and summary statistics.

## Tech Stack

- **Backend**: Node.js (Vercel Serverless Functions)
- **Frontend**: Vanilla HTML/CSS/JS
- **Hosting**: Vercel

## Local Development

```bash
npx vercel dev
```

## Author

Aryan Sheladia — aryan.sheladia.btech2023@sitpune.edu.in

/**
 * migrate-webflow.mjs
 * Migre les 19 CSV Webflow → content collections Astro.
 * Usage : node scripts/migrate-webflow.mjs
 */

import { parse } from 'csv-parse/sync';
import {
  readFileSync, writeFileSync, mkdirSync,
  existsSync, readdirSync, unlinkSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, 'source-cms-weblow');
const CONTENT = join(ROOT, 'src', 'content');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readCsv(pattern) {
  const files = readdirSync(SOURCE).filter((f) => f.includes(pattern));
  if (!files.length) {
    console.warn(`  ⚠ CSV introuvable : "${pattern}"`);
    return [];
  }
  const path = join(SOURCE, files[0]);
  const raw = readFileSync(path, 'utf-8');
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function safeFilename(slug) {
  return slug.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function writeJson(dir, slug, data) {
  // Retire les champs undefined pour garder un JSON propre
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  writeFileSync(join(dir, `${safeFilename(slug)}.json`), JSON.stringify(clean, null, 2), 'utf-8');
}

function writeMd(dir, slug, frontmatter, body) {
  const lines = [];
  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      lines.push(`${k}: [${v.map((s) => `"${String(s).replace(/"/g, '\\"')}"`).join(', ')}]`);
    } else if (typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else if (typeof v === 'number') {
      lines.push(`${k}: ${v}`);
    } else {
      const s = String(v).replace(/"/g, '\\"');
      lines.push(`${k}: "${s}"`);
    }
  }
  const content = `---\n${lines.join('\n')}\n---\n\n${body || ''}`;
  writeFileSync(join(dir, `${safeFilename(slug)}.md`), content, 'utf-8');
}

function parseDate(str) {
  if (!str) return null;
  try {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  } catch { return null; }
}

function isPublished(row) {
  return row['Archived'] !== 'true' && row['Draft'] !== 'true';
}

function stripHtml(html, maxLen = 250) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function parseNum(v) {
  const n = parseFloat(String(v || '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function clearDir(dir) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir)) {
    if (f.endsWith('.json') || f.endsWith('.md')) {
      try { unlinkSync(join(dir, f)); } catch {}
    }
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const stats = {};
function count(key, n) { stats[key] = (stats[key] || 0) + n; }

// ─── 1. Régions ───────────────────────────────────────────────────────────────

function migrateRegions() {
  console.log('\n📍 Régions...');
  const dir = join(CONTENT, 'regions');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Brasserie Regions');
  const deptRows = readCsv('Brasseries Départements');

  // Regroupe les départements par région
  const deptByRegion = {};
  for (const d of deptRows) {
    const r = (d['Region'] || '').trim();
    if (!r) continue;
    if (!deptByRegion[r]) deptByRegion[r] = [];
    deptByRegion[r].push(d['Slug']);
  }

  let n = 0;
  for (const row of rows) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      departements: deptByRegion[slug] || [],
    });
    n++;
  }
  count('regions', n);
  console.log(`  ✓ ${n} régions`);
}

// ─── 2. Départements ──────────────────────────────────────────────────────────

function migrateDepartements() {
  console.log('\n🗺  Départements...');
  const dir = join(CONTENT, 'departements');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Brasseries Départements');
  let n = 0;
  for (const row of rows) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      region: (row['Region'] || '').trim(),
    });
    n++;
  }
  count('departements', n);
  console.log(`  ✓ ${n} départements`);
}

// ─── 3. Brasseries ────────────────────────────────────────────────────────────

function migrateBrasseries() {
  console.log('\n🏭 Brasseries artisanales...');
  const dir = join(CONTENT, 'brasseries');
  ensureDir(dir);
  clearDir(dir); // Efface les 3 exemples créés manuellement

  const rows = readCsv('Brasserie Artisanales');
  let n = 0, skipped = 0;

  for (const row of rows) {
    // Garde les archivées (= fermées), ignore uniquement les drafts non publiés
    if (row['Draft'] === 'true' && !row['Published On']) { skipped++; continue; }
    const slug = (row['Slug'] || '').trim();
    if (!slug) { skipped++; continue; }

    const statut = row['Archived'] === 'true' ? 'ferme' : 'actif';
    const cp = (row['postalCode'] || '').trim().replace(/\s/g, '');
    const ville = (row['Ville'] || row['City'] || '').trim();
    const region = (row['Région'] || '').trim().toLowerCase();
    const departement = (row['Département'] || '').trim().toLowerCase();
    const descRaw = (row['short_desc'] || '').trim();
    const description = descRaw ? stripHtml(descRaw, 500) : undefined;
    const image = row['logo 120x120'] || undefined;
    const website = row['website'] || undefined;

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      cp: cp || '00000',
      ville,
      region: region || 'france',
      departement,
      description,
      image,
      website,
      statut,
      aBiereSansAlcool: false,
    });
    n++;
  }
  count('brasseries', n);
  console.log(`  ✓ ${n} brasseries (${skipped} ignorées — drafts sans publication)`);
}

// ─── 4. Articles (3 sources) ──────────────────────────────────────────────────

function migrateArticles() {
  console.log('\n📰 Articles...');
  const dir = join(CONTENT, 'articles');
  ensureDir(dir);
  clearDir(dir);

  const sources = [
    { csv: 'Articles',           tags: ['article'] },
    { csv: 'A-Brassage Amateurs', tags: ['brassage-amateur'] },
    { csv: 'A-Microbrasseries',  tags: ['microbrasseries'] },
  ];

  let n = 0, skipped = 0;

  for (const { csv, tags } of sources) {
    const rows = readCsv(csv);
    for (const row of rows) {
      if (!isPublished(row)) { skipped++; continue; }
      const slug = (row['Slug'] || '').trim();
      if (!slug) { skipped++; continue; }

      const titre = (row['Name'] || '').trim();
      const date = parseDate(row['Published On'] || row['Created On']) || '2020-01-01';
      const excerpt = stripHtml(row['Post Summary'] || row['Post Body'] || '', 300) || titre;
      const image = (row['Main Image'] || row['Thumbnail image'] || '').trim() || undefined;
      const rowTags = [...tags];
      if (row['Featured?'] === 'true') rowTags.push('a-la-une');

      writeMd(dir, slug, {
        titre,
        date,
        excerpt: excerpt.replace(/"/g, "'"),
        image,
        tags: rowTags,
        sponsorise: false,
      }, row['Post Body'] || '');
      n++;
    }
  }
  count('articles', n);
  console.log(`  ✓ ${n} articles (${skipped} ignorés)`);
}

// ─── 5. Recettes de bière ─────────────────────────────────────────────────────

function migrateRecettes() {
  console.log('\n🍻 Recettes de bière...');
  const dir = join(CONTENT, 'recettes');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Recette bieres');
  let n = 0, skipped = 0;

  for (const row of rows) {
    if (!isPublished(row)) { skipped++; continue; }
    const slug = (row['Slug'] || '').trim();
    if (!slug) { skipped++; continue; }

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      description: row['Sumup (SEO)'] || undefined,
      image: row['Cover Photo'] || undefined,
      style: row['Style'] || undefined,
      ibu: parseNum(row['IBU']),
      srm: parseNum(row['SRM']),
      og: parseNum(row['FIN. OG'] || row['EST. OG']),
      fg: parseNum(row['FIN. FG'] || row['EST. FG']),
      abv: parseNum(row['FIN. ABV'] || row['EST. ABV']),
      batchSize: (row['BATCH SIZE'] || '').trim() || undefined,
      boilTime: (row['BOIL TIME'] || '').trim() || undefined,
      intro: row['Le mot de présentation'] ? stripHtml(row['Le mot de présentation'], 600) : undefined,
      introHtml: row['Le mot de présentation'] || undefined,
      maltComposition: row['Malt Composition'] || undefined,
      houblonComposition: row['Houblon Composition'] || undefined,
      levureComposition: row['Levure Composition'] || undefined,
    });
    n++;
  }
  count('recettes', n);
  console.log(`  ✓ ${n} recettes (${skipped} ignorées)`);
}

// ─── 6. Houblons ──────────────────────────────────────────────────────────────

function migrateHoublons() {
  console.log('\n🌿 Houblons...');
  const dir = join(CONTENT, 'houblons');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Houblons -');
  let n = 0;

  for (const row of rows) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    const aromes = (row['Aromas'] || '').split(';').map((s) => s.trim()).filter(Boolean);

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      description: row['Description'] || undefined,
      aaMin: parseNum(row['aaMin']),
      aaMax: parseNum(row['aaMax']),
      baMin: parseNum(row['baMin']),
      baMax: parseNum(row['baMax']),
      usage: (row['Usage'] || '').trim() || undefined,
      stabilite: (row['stability'] || '').trim() || undefined,
      cohumulone: (row['cohumulone'] || '').trim() || undefined,
      myrcene: (row['myrcene'] || '').trim() || undefined,
      caryophyllene: (row['caryophyllene'] || '').trim() || undefined,
      humulene: (row['humulene'] || '').trim() || undefined,
      aromes,
    });
    n++;
  }
  count('houblons', n);
  console.log(`  ✓ ${n} houblons`);
}

// ─── 7. Arômes de houblons ────────────────────────────────────────────────────

function migrateHoublonsAromes() {
  console.log('\n🌸 Arômes de houblons...');
  const dir = join(CONTENT, 'houblonsAromes');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Houblons Aromes');
  let n = 0;
  for (const row of rows) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;
    writeJson(dir, slug, { slug, nom: row['Name'] });
    n++;
  }
  count('houblonsAromes', n);
  console.log(`  ✓ ${n} arômes`);
}

// ─── 8. Styles et familles de bière ───────────────────────────────────────────

function migrateBieresStyles() {
  console.log('\n🎨 Styles de bière...');
  const dirStyles   = join(CONTENT, 'bieresStyles');
  const dirFamilles = join(CONTENT, 'bieresFamilles');
  ensureDir(dirStyles);
  ensureDir(dirFamilles);
  clearDir(dirStyles);
  clearDir(dirFamilles);

  const styles = readCsv('Bière Styles');
  let nS = 0;
  for (const row of styles) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;
    writeJson(dirStyles, slug, { slug, nom: row['Name'], description: row['Description'] || undefined });
    nS++;
  }

  const familles = readCsv('Bière Famille Styles');
  let nF = 0;
  for (const row of familles) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;
    writeJson(dirFamilles, slug, { slug, nom: row['Name'], description: row['Description'] || undefined });
    nF++;
  }

  const couleurs = readCsv('Bière Couleurs');
  let nC = 0;
  const dirCouleurs = join(CONTENT, 'bieresCouleurs');
  ensureDir(dirCouleurs);
  clearDir(dirCouleurs);
  for (const row of couleurs) {
    if (row['Archived'] === 'true') continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;
    writeJson(dirCouleurs, slug, { slug, nom: row['Name'] });
    nC++;
  }

  count('bieresStyles', nS + nF + nC);
  console.log(`  ✓ ${nS} styles + ${nF} familles + ${nC} couleurs`);
}

// ─── 9. Bières artisanales (catalogue produits) ────────────────────────────────

function migrateBieresArtisanales() {
  console.log('\n🍶 Bières artisanales (catalogue)...');
  const dir = join(CONTENT, 'bieresArtisanales');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Bières Artisanales');
  let n = 0;
  for (const row of rows) {
    if (!isPublished(row)) continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      nomCourt: row['Short Name'] || undefined,
      description: row['Description'] || undefined,
      photo: row['Photo'] || undefined,
      abv: parseNum(row['Alcohol']),
      amertume: parseNum(row['Bitterness']),
      couleur: row['Color'] || undefined,
      style: row['Style'] || undefined,
      famille: row['Famille'] || undefined,
      brasserie: row['Brasserie'] || undefined,
    });
    n++;
  }
  count('bieresArtisanales', n);
  console.log(`  ✓ ${n} bières artisanales`);
}

// ─── 10. Cavistes ─────────────────────────────────────────────────────────────

function migrateCavistes() {
  console.log('\n🏪 Cavistes...');
  const dir = join(CONTENT, 'cavistes');
  ensureDir(dir);
  clearDir(dir);

  const rows = readCsv('Cavistes');
  let n = 0;
  for (const row of rows) {
    if (!isPublished(row)) continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      adresse: row['Adresse'] || undefined,
      cp: row['Postal Code'] || undefined,
      ville: row['City'] || undefined,
      telephone: row['Telephone'] || undefined,
      email: row['Email'] || undefined,
      siteWeb: row['site web'] || undefined,
    });
    n++;
  }
  count('cavistes', n);
  console.log(`  ✓ ${n} cavistes`);
}

// ─── 11. Fournisseurs ─────────────────────────────────────────────────────────

function migrateFournisseurs() {
  console.log('\n🏭 Fournisseurs...');
  const dir = join(CONTENT, 'fournisseurs');
  ensureDir(dir);
  clearDir(dir);

  // Types de fournisseurs (référentiel)
  const typesRows = readCsv('Type-Fournisseurs');
  const types = {};
  for (const t of typesRows) {
    if (t['Item ID']) types[t['Item ID']] = t['Name'];
  }

  const dirTypes = join(CONTENT, 'fournisseursTypes');
  ensureDir(dirTypes);
  clearDir(dirTypes);
  for (const t of typesRows) {
    if (!t['Slug']) continue;
    writeJson(dirTypes, t['Slug'], { slug: t['Slug'], nom: t['Name'] });
  }

  const rows = readCsv('Fournisseurs');
  let n = 0;
  for (const row of rows) {
    if (!isPublished(row)) continue;
    const slug = (row['Slug'] || '').trim();
    if (!slug) continue;

    const typeIds = (row['Types Fournisseurs'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const typeNoms = typeIds.map((id) => types[id] || id);

    writeJson(dir, slug, {
      slug,
      nom: row['Name'],
      description: stripHtml(row['Description'] || '', 400) || undefined,
      email: (row['emaiil'] || '').trim() || undefined,
      siteWeb: (row['website'] || '').trim() || undefined,
      types: typeNoms,
    });
    n++;
  }
  count('fournisseurs', n);
  console.log(`  ✓ ${n} fournisseurs`);
}

// ─── Entrée principale ────────────────────────────────────────────────────────

function main() {
  console.log('🚀 Migration Webflow → Astro content collections');
  console.log('─'.repeat(50));
  console.log(`Source : ${SOURCE}`);
  console.log(`Cible  : ${CONTENT}\n`);

  migrateRegions();
  migrateDepartements();
  migrateBrasseries();
  migrateArticles();
  migrateRecettes();
  migrateHoublons();
  migrateHoublonsAromes();
  migrateBieresStyles();
  migrateBieresArtisanales();
  migrateCavistes();
  migrateFournisseurs();

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Migration terminée\n');
  console.log('Collection             Fichiers créés');
  console.log('─'.repeat(35));
  let total = 0;
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k.padEnd(22)} ${String(v).padStart(5)}`);
    total += v;
  }
  console.log('─'.repeat(35));
  console.log(`  ${'TOTAL'.padEnd(22)} ${String(total).padStart(5)}`);
  console.log('\n→ npm run build pour valider');
}

main();

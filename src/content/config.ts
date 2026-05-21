import { defineCollection, z } from 'astro:content';

// ─── Collections existantes ───────────────────────────────────────────────────

const brasseriesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    cp: z.string(),
    ville: z.string(),
    region: z.string(),
    departement: z.string().optional().default(''),
    description: z.string().optional(),
    image: z.string().optional(),
    website: z.string().optional(),
    statut: z.enum(['actif', 'ferme', 'inconnu']).default('actif'),
    aBiereSansAlcool: z.boolean().default(false),
    biereSansAlcoolNom: z.string().optional(),
    urlAffilie: z.string().optional(),
  }),
});

const regionsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
    departements: z.array(z.string()).default([]),
  }),
});

const articlesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    titre: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).default([]),
    sponsorise: z.boolean().default(false),
  }),
});

const bieresSansAlcoolCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    marque: z.string(),
    brasserie: z.string().optional(),
    style: z.string(),
    categorieSeo: z.string().optional(),
    abv: z.number().min(0).max(100),
    description: z.string(),
    profilAromatique: z.string(),
    prixMoyen: z.number().nonnegative(),
    note: z.number().min(1).max(5).nullable().optional(),
    urlSaveurBiere: z.string().optional(),
    urlUnePetiteMousse: z.string().optional(),
    urlBeerWulf: z.string().optional(),
    siteOfficielBrasserie: z.string().optional(),
    avisZythologue: z.string(),
    bio: z.boolean().optional(),
    sansGluten: z.boolean().optional(),
    paysProduction: z.string().optional(),
  }),
});

// ─── Nouvelles collections migrées ───────────────────────────────────────────

const departementsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    region: z.string(),
  }),
});

const recettesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    style: z.string().optional(),
    ibu: z.number().optional(),
    srm: z.number().optional(),
    og: z.number().optional(),
    fg: z.number().optional(),
    abv: z.number().optional(),
    batchSize: z.string().optional(),
    boilTime: z.string().optional(),
    intro: z.string().optional(),
    introHtml: z.string().optional(),
    maltComposition: z.string().optional(),
    houblonComposition: z.string().optional(),
    levureComposition: z.string().optional(),
  }),
});

const houblonsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
    aaMin: z.number().optional(),
    aaMax: z.number().optional(),
    baMin: z.number().optional(),
    baMax: z.number().optional(),
    usage: z.string().optional(),
    stabilite: z.string().optional(),
    cohumulone: z.string().optional(),
    myrcene: z.string().optional(),
    caryophyllene: z.string().optional(),
    humulene: z.string().optional(),
    aromes: z.array(z.string()).default([]),
  }),
});

const houblonsAromesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
  }),
});

const bieresStylesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
  }),
});

const bieresFamillesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
  }),
});

const bieresCouleurs = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
  }),
});

const bieresArtisanalesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    nomCourt: z.string().optional(),
    description: z.string().optional(),
    photo: z.string().optional(),
    abv: z.number().optional(),
    amertume: z.number().optional(),
    couleur: z.string().optional(),
    style: z.string().optional(),
    famille: z.string().optional(),
    brasserie: z.string().optional(),
  }),
});

const cavistesColl = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    adresse: z.string().optional(),
    cp: z.string().optional(),
    ville: z.string().optional(),
    telephone: z.string().optional(),
    email: z.string().optional(),
    siteWeb: z.string().optional(),
  }),
});

const fournisseursColl = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
    description: z.string().optional(),
    email: z.string().optional(),
    siteWeb: z.string().optional(),
    types: z.array(z.string()).default([]),
  }),
});

const fournisseursTypesColl = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    nom: z.string(),
  }),
});

export const collections = {
  brasseries: brasseriesCollection,
  regions: regionsCollection,
  articles: articlesCollection,
  bieresSansAlcool: bieresSansAlcoolCollection,
  departements: departementsCollection,
  recettes: recettesCollection,
  houblons: houblonsCollection,
  houblonsAromes: houblonsAromesCollection,
  bieresStyles: bieresStylesCollection,
  bieresFamilles: bieresFamillesCollection,
  bieresCouleurs: bieresCouleurs,
  bieresArtisanales: bieresArtisanalesCollection,
  cavistes: cavistesColl,
  fournisseurs: fournisseursColl,
  fournisseursTypes: fournisseursTypesColl,
};

export type SuggestedLink = {
  url: string;
  label: string;
  reason: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_DEFAULT_TARGET_SITE || "https://oryvalo.com";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const rules: Array<{ keywords: string[]; path: string; label: string }> = [
  { keywords: ["make money", "earn money", "passive income", "side hustle", "income"], path: "/make-money-with-ai", label: "Make money with AI" },
  { keywords: ["ai tools", "best ai", "tool", "tools", "chatgpt"], path: "/best-ai-tools", label: "Best AI tools" },
  { keywords: ["affiliate", "affiliation", "commission", "partner program"], path: "/affiliate-programs", label: "Affiliate programs" },
  { keywords: ["saas", "software", "startup"], path: "/best-saas-tools", label: "Best SaaS tools" },
];

export function suggestTargetLink(input: string): SuggestedLink {
  const text = input.toLowerCase();
  const match = rules.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));

  if (match) {
    return {
      url: `${BASE_URL}${match.path}`,
      label: match.label,
      reason: "Correspondance mot-clé",
    };
  }

  return {
    url: `${BASE_URL}/${slugify(input)}`,
    label: "Article suggéré",
    reason: "Slug généré depuis le mot-clé",
  };
}

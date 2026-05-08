import sgMail from "@sendgrid/mail";

function getClient() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("Missing SENDGRID_API_KEY");
  sgMail.setApiKey(key);
  return sgMail;
}

export async function sendBacklinkWonEmail(opts: {
  to: string;
  sourceUrl: string;
  targetUrl: string;
  siteName: string;
}) {
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!from) return;

  await getClient().send({
    to: opts.to,
    from,
    subject: `Backlink gagné — ${opts.siteName}`,
    html: `
      <h2>Backlink confirmé ✅</h2>
      <p>Un backlink vers <strong>${opts.targetUrl}</strong> a été détecté sur :</p>
      <p><a href="${opts.sourceUrl}">${opts.sourceUrl}</a></p>
      <p>Site : ${opts.siteName}</p>
    `,
  });
}

export async function sendWeeklyDigestEmail(opts: {
  to: string;
  pending: number;
  won: number;
  siteName: string;
}) {
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!from) return;

  await getClient().send({
    to: opts.to,
    from,
    subject: `Résumé hebdo Backlink OS — ${opts.siteName}`,
    html: `
      <h2>Résumé de la semaine</h2>
      <p>Site : <strong>${opts.siteName}</strong></p>
      <ul>
        <li>Backlinks en attente : <strong>${opts.pending}</strong></li>
        <li>Backlinks gagnés : <strong>${opts.won}</strong></li>
      </ul>
    `,
  });
}

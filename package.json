const express = require('express');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const app = express();
app.use(express.json());

// ============================================
// CONFIGURATION — À remplir avec les clés MobCash
// ============================================
const CONFIG = {
  MOBCASH_URL: 'https://partners.servcul.com/CashdeskBotAPI',
  HASH: process.env.MOBCASH_HASH || '',
  CASHIERPASS: process.env.MOBCASH_CASHIERPASS || '',
  LOGIN: process.env.MOBCASH_LOGIN || '',
  CASHDESKID: process.env.MOBCASH_CASHDESKID || '',
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '8846519263:AAElTs6UGuo1WfjZfHQQcK3E3HVfDHRZhys',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '8022571456',
  SECRET: process.env.SERVER_SECRET || 'mobcash2024secret'
};

// ============================================
// UTILITAIRES CRYPTO (selon doc MobCash)
// ============================================
function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}
function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

// Signature pour dépôt / retrait
function genSign(lng, userid) {
  const part1 = sha256(`hash=${CONFIG.HASH}&lng=${lng}&Userid=${userid}`);
  const part2 = md5(`summa=0&cashierpass=${CONFIG.CASHIERPASS}&cashdeskid=${CONFIG.CASHDESKID}`);
  return sha256(part1 + part2);
}

// Signature pour recherche joueur
function genSignPlayer(userid) {
  const part1 = sha256(`hash=${CONFIG.HASH}&userid=${userid}&cashdeskid=${CONFIG.CASHDESKID}`);
  const part2 = md5(`userid=${userid}&cashierpass=${CONFIG.CASHIERPASS}&hash=${CONFIG.HASH}`);
  return sha256(part1 + part2);
}

// Signature pour solde
function genSignBalance(dt) {
  const part1 = sha256(`hash=${CONFIG.HASH}&cashdeskid=${CONFIG.CASHDESKID}&dt=${dt}`);
  const part2 = md5(`dt=${dt}&cashierpass=${CONFIG.CASHIERPASS}&cashdeskid=${CONFIG.CASHDESKID}`);
  return sha256(part1 + part2);
}

// Confirm = MD5(userId:hash)
function genConfirm(userId) {
  return md5(`${userId}:${CONFIG.HASH}`);
}

// Confirm pour balance = MD5(cashdeskId:hash)
function genConfirmBalance() {
  return md5(`${CONFIG.CASHDESKID}:${CONFIG.HASH}`);
}

// ============================================
// TELEGRAM
// ============================================
async function sendTelegram(text, keyboard = null) {
  const body = {
    chat_id: CONFIG.TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'HTML'
  };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };

  await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

// ============================================
// PING (garder le serveur éveillé)
// ============================================
app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ============================================
// RECHERCHE JOUEUR
// ============================================
app.get('/player/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!CONFIG.HASH) return res.json({ success: false, message: 'API MobCash non configurée' });

  try {
    const sign = genSignPlayer(userId);
    const confirm = genConfirm(userId);
    const url = `${CONFIG.MOBCASH_URL}/Users/${userId}?confirm=${confirm}&cashdeskid=${CONFIG.CASHDESKID}`;

    const response = await fetch(url, { headers: { sign } });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// ============================================
// DÉPÔT — Enregistrer la demande + notifier Joseph
// ============================================
const pendingDeposits = {};

app.post('/depot', async (req, res) => {
  const { ref, clientNom, clientWa, clientId1xbet, montant, methode, codeSMS, agentNom } = req.body;

  // Stocker en mémoire
  pendingDeposits[ref] = req.body;

  // Notifier Joseph avec boutons Telegram
  const msg = `<b>💳 NOUVEAU DÉPÔT</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `👤 <b>Client :</b> ${clientNom}\n` +
    `📱 <b>WhatsApp :</b> ${clientWa}\n` +
    `🔢 <b>ID 1xBet :</b> ${clientId1xbet}\n` +
    `💰 <b>Montant :</b> ${Number(montant).toLocaleString('fr-FR')} GNF\n` +
    `📲 <b>Méthode :</b> ${methode}\n` +
    `🔑 <b>Code SMS :</b> <code>${codeSMS}</code>\n` +
    `📋 <b>Réf :</b> <code>${ref}</code>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Vérifiez le paiement puis confirmez</i>`;

  const keyboard = [
    [
      { text: '✅ Confirmer et créditer', callback_data: `confirm_depot_${ref}` },
      { text: '❌ Rejeter', callback_data: `reject_depot_${ref}` }
    ]
  ];

  await sendTelegram(msg, keyboard);
  res.json({ success: true, ref });
});

// ============================================
// RETRAIT — Enregistrer + notifier Joseph
// ============================================
const pendingRetraits = {};

app.post('/retrait', async (req, res) => {
  const { ref, clientNom, clientWa, clientId1xbet, montant, codeRetrait, numeroReception, methode } = req.body;

  pendingRetraits[ref] = req.body;

  const msg = `<b>💰 NOUVEAU RETRAIT</b>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `👤 <b>Client :</b> ${clientNom}\n` +
    `📱 <b>WhatsApp :</b> ${clientWa}\n` +
    `🔢 <b>ID 1xBet :</b> ${clientId1xbet}\n` +
    `💰 <b>Montant :</b> ${Number(montant).toLocaleString('fr-FR')} GNF\n` +
    `🔑 <b>Code retrait :</b> <code>${codeRetrait}</code>\n` +
    `📲 <b>Réception :</b> ${numeroReception}\n` +
    `💳 <b>Méthode :</b> ${methode}\n` +
    `📋 <b>Réf :</b> <code>${ref}</code>\n` +
    `━━━━━━━━━━━━━━━\n` +
    `⚡ <i>Vérifiez et traitez le retrait</i>`;

  const keyboard = [
    [
      { text: '✅ Confirmer le retrait', callback_data: `confirm_retrait_${ref}` },
      { text: '❌ Rejeter', callback_data: `reject_retrait_${ref}` }
    ]
  ];

  await sendTelegram(msg, keyboard);
  res.json({ success: true, ref });
});

// ============================================
// WEBHOOK TELEGRAM — Reçoit les clics de Joseph
// ============================================
app.post('/webhook', async (req, res) => {
  const update = req.body;
  res.json({ ok: true });

  if (!update.callback_query) return;

  const query = update.callback_query;
  const data = query.data;
  const messageId = query.message.message_id;

  // Répondre à Telegram pour enlever le spinner
  await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: query.id })
  });

  // ---- DÉPÔT CONFIRMÉ ----
  if (data.startsWith('confirm_depot_')) {
    const ref = data.replace('confirm_depot_', '');
    const depot = pendingDeposits[ref];
    if (!depot) {
      await sendTelegram(`⚠️ Transaction ${ref} introuvable ou déjà traitée.`);
      return;
    }

    if (!CONFIG.HASH) {
      // Mode test — API MobCash pas encore configurée
      await sendTelegram(`✅ <b>DÉPÔT CONFIRMÉ (mode test)</b>\n📋 Réf: <code>${ref}</code>\n👤 ${depot.clientNom}\n💰 ${Number(depot.montant).toLocaleString('fr-FR')} GNF\n\n<i>API MobCash pas encore configurée — crédit manuel requis</i>`);
      delete pendingDeposits[ref];
      return;
    }

    // Appel API MobCash
    try {
      const lng = 'fr';
      const userId = depot.clientId1xbet;
      const sign = genSign(lng, userId);
      const confirm = genConfirm(userId);

      const response = await fetch(`${CONFIG.MOBCASH_URL}/Deposit/${userId}/Add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'sign': sign },
        body: JSON.stringify({
          cashdeskid: parseInt(CONFIG.CASHDESKID),
          lng,
          summa: parseFloat(depot.montant),
          confirm
        })
      });

      const result = await response.json();
      if (result.success) {
        await sendTelegram(`✅ <b>DÉPÔT CRÉDITÉ avec succès !</b>\n📋 Réf: <code>${ref}</code>\n👤 ${depot.clientNom}\n💰 ${Number(depot.montant).toLocaleString('fr-FR')} GNF\n🎯 ID 1xBet: ${userId}`);
        delete pendingDeposits[ref];
      } else {
        await sendTelegram(`❌ <b>Erreur MobCash</b>\n📋 Réf: <code>${ref}</code>\nErreur: ${result.message || 'Inconnue'}\nCode: ${result.messageId}`);
      }
    } catch (e) {
      await sendTelegram(`❌ Erreur serveur: ${e.message}`);
    }
  }

  // ---- DÉPÔT REJETÉ ----
  else if (data.startsWith('reject_depot_')) {
    const ref = data.replace('reject_depot_', '');
    const depot = pendingDeposits[ref];
    await sendTelegram(`❌ <b>DÉPÔT REJETÉ</b>\n📋 Réf: <code>${ref}</code>\n👤 ${depot ? depot.clientNom : 'Inconnu'}\n\n<i>Le client sera contacté sur WhatsApp.</i>`);
    delete pendingDeposits[ref];
  }

  // ---- RETRAIT CONFIRMÉ ----
  else if (data.startsWith('confirm_retrait_')) {
    const ref = data.replace('confirm_retrait_', '');
    const retrait = pendingRetraits[ref];
    if (!retrait) {
      await sendTelegram(`⚠️ Transaction ${ref} introuvable ou déjà traitée.`);
      return;
    }

    if (!CONFIG.HASH) {
      await sendTelegram(`✅ <b>RETRAIT CONFIRMÉ (mode test)</b>\n📋 Réf: <code>${ref}</code>\n👤 ${retrait.clientNom}\n💰 ${Number(retrait.montant).toLocaleString('fr-FR')} GNF\n\n<i>API MobCash pas encore configurée — traitement manuel requis</i>`);
      delete pendingRetraits[ref];
      return;
    }

    try {
      const lng = 'fr';
      const userId = retrait.clientId1xbet;
      const sign = genSign(lng, userId);
      const confirm = genConfirm(userId);

      const response = await fetch(`${CONFIG.MOBCASH_URL}/Deposit/${userId}/Payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'sign': sign },
        body: JSON.stringify({
          cashdeskId: parseInt(CONFIG.CASHDESKID),
          lng,
          code: retrait.codeRetrait,
          confirm
        })
      });

      const result = await response.json();
      if (result.success) {
        await sendTelegram(`✅ <b>RETRAIT TRAITÉ avec succès !</b>\n📋 Réf: <code>${ref}</code>\n👤 ${retrait.clientNom}\n💰 ${Number(result.summa || retrait.montant).toLocaleString('fr-FR')} GNF`);
        delete pendingRetraits[ref];
      } else {
        await sendTelegram(`❌ <b>Erreur MobCash retrait</b>\nErreur: ${result.message || 'Inconnue'}`);
      }
    } catch (e) {
      await sendTelegram(`❌ Erreur serveur: ${e.message}`);
    }
  }

  // ---- RETRAIT REJETÉ ----
  else if (data.startsWith('reject_retrait_')) {
    const ref = data.replace('reject_retrait_', '');
    const retrait = pendingRetraits[ref];
    await sendTelegram(`❌ <b>RETRAIT REJETÉ</b>\n📋 Réf: <code>${ref}</code>\n👤 ${retrait ? retrait.clientNom : 'Inconnu'}`);
    delete pendingRetraits[ref];
  }
});

// ============================================
// SOLDE CAISSE
// ============================================
app.get('/balance', async (req, res) => {
  if (!CONFIG.HASH) return res.json({ success: false, message: 'API MobCash non configurée' });
  try {
    const dt = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const sign = genSignBalance(dt);
    const confirm = genConfirmBalance();
    const url = `${CONFIG.MOBCASH_URL}/Cashdesk/${CONFIG.CASHDESKID}/Balance?confirm=${confirm}&dt=${encodeURIComponent(dt)}`;
    const response = await fetch(url, { headers: { sign } });
    const data = await response.json();
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});

// ============================================
// DÉMARRAGE
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur MobCash démarré sur le port ${PORT}`);

  // Configurer le webhook Telegram automatiquement
  const RENDER_URL = process.env.RENDER_URL || '';
  if (RENDER_URL) {
    fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${RENDER_URL}/webhook` })
    }).then(() => console.log('Webhook Telegram configuré'));
  }
});

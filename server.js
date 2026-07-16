const express = require('express');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

// CORS
app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if(req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ============================================
// FIREBASE
// ============================================
const serviceAccount = {
  type: "service_account",
  project_id: "mobcash-joseph",
  private_key_id: "71d52e739f8f45409192cc569d8aac1246ec627e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDWxq51YvczDC+D\n2FpJcAstFqkZ7jsTdT+86S3sx/IteIPp2yZivDEOEUj9/kCf+Becmjj29M31/Q6T\nBc+uzn3eRilcBmp8j2nRNtvIkx5F6zL7hR5bsfOOgdM+K9vyRLHzv2rmAvuPIvo0\nsAF/CQDQxcC+5+pHnwGn6KxL7xRWt+dElyOrgyXl+bwCDYdE0V1yyF0wlyDK+bhb\n9bIGjRzpm8MDY3tFSlPC8XlJXtpEvfnCYAY72zAVecWhWZxjCLIZFPAnjxkUSxvC\nOjeB/4ANNJbEXZZjGTJhQr1vaI8FhnHrZ4L6CHZUjKhAc3QoGyM09kjqKvfHbNCT\nGsVbIrPXAgMBAAECggEALU6SRN8QqKscZuLAARfqs6NBHuA7hBpKzM4fywBO3Tq8\nERwS1+c9LeuFi1cUSOqsCHQcKjRwMkEkzuz957FVqgsA9JHB6u7R8rlw2bn3O+am\nxZpKUiuS5nAKoOXdqxjEtVee9FCSwpotT+oFFshObLwaser4aA1p6wLRPd98WeJk\nlr+cCz0VQzectYA+GIpQ2a6XtuoaFL3wrL+FF+bp54VozDE0aWbIW/TMrEtKl8h0\nXbe01lJrtBM7LARQTV2Pzu/cPuohSLz11SSS5qh3IG9eOB0ZdkZMQVjQfzJmCBA8\ntWvy+ZbGWX9n97oOLemyBHhl3HhV2ze6VATrpYfgMQKBgQD1KtZ9hnNEBnZZ1uBy\nPR8Quug3AXS2XxTpV15l5LuR6aj1a5RnmsBvtyednXBHOgc8GMriqJSJqGaSbE/j\nWw35+trDl6DToqwedbKidI4HnE7cgZftout15T7h0JxTt9l0KLeANsWsGcruyepF\nywY/G8b6dLkyEa987S2vVE5MvwKBgQDgRBRCBnNnIrufG0oM7G57h5ySl8KIqbQo\nBGu1/KxFfyyW3RTk1/Bsw2ImdfR7w65Zji0BsDarV6ucQCOo0OlrwzPy7COrzypS\nFlKC3UX1hsHKyanyYve2O3HCnzUEIdcyNRyNGDjr44IguxrD0PuihqaRyigpFNU9\np4hSXaWm6QKBgDgYRBlWcPsoi13E53fb+kamrUkgoSa1HKDDJ8siibQ6BTmaEsud\nwdgNzReoFS+G3G7osUspDUtt54IrHCBGDi2bMwC7qcWim8UgYu3+wxyErBqR4EQ0\nGbHQ8RFT3ODe2PdV9Z51accV47O9KUgsytIXtfBKUrFdEI0B64kJPh0bAoGATdfT\noEdU70ujDEsQnQPEJaSguFFs+LrPCcTfDkAyG71U4NjEU9qQXXBENU1kG0GE1xj+\njkN39mlr68RnnEVHgFw1P/CvQQebjPqqkTn0+pBX2+e70aKAkQR5LDDO2ixU4dyF\nmIP73gUOOgY3+Bgl//f1AU3GOtw8WDY6nzxaL2ECgYByD6vm3mRNU70gn6s5lv+E\nvHvuDQEzNEdW9CxVnFSZm5MjaDwBHPvRA0EOA1hWk1VWaXBbD15ujuLVCnfc7ZkO\nf6WyLGZ3vBpqY+mGlrSgYgWqj2xuvt/8YIqBY8jYs0tDevy/z24DVUbDdYjWwrIs\n+TgKMOhzJVAn06CWNpNfLw==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@mobcash-joseph.iam.gserviceaccount.com",
  client_id: "103580781431988851964",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token"
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'mobcash-joseph' });
const db = admin.firestore();

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  MOBCASH_URL: 'https://partners.servcul.com/CashdeskBotAPI',
  HASH: process.env.MOBCASH_HASH || '',
  CASHIERPASS: process.env.MOBCASH_CASHIERPASS || '',
  LOGIN: process.env.MOBCASH_LOGIN || '',
  CASHDESKID: process.env.MOBCASH_CASHDESKID || '',
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '8846519263:AAElTs6UGuo1WfjZfHQQcK3E3HVfDHRZhys',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '8022571456',
  RENDER_URL: process.env.RENDER_URL || 'https://mobcash-server.onrender.com',
  // Bots des agents
  BOTS: {
    'joseph': {
      token: '7979158544:AAG5_MhnoMZ0UpIzU0GC_mEpDIFYqi1l31s',
      chatId: '1010477144',
      webhook: '/webhook/joseph'
    }
  }
};

// ============================================
// CRYPTO
// ============================================
function sha256(str){ return crypto.createHash('sha256').update(str).digest('hex'); }
function md5(str){ return crypto.createHash('md5').update(str).digest('hex'); }

function genSignDepot(lng, userid, summa){
  const p1 = sha256('hash='+CONFIG.HASH+'&lng='+lng+'&userid='+userid);
  const p2 = md5('summa='+summa+'&cashierpass='+CONFIG.CASHIERPASS+'&cashdeskid='+CONFIG.CASHDESKID);
  const sign = sha256(p1 + p2);
  console.log('[DEPOT SIGN] p1='+p1+' p2='+p2+' sign='+sign);
  return sign;
}

function genSignRetrait(lng, userid, code){
  const p1 = sha256('hash='+CONFIG.HASH+'&lng='+lng+'&userid='+userid);
  const p2 = md5('code='+code+'&cashierpass='+CONFIG.CASHIERPASS+'&cashdeskid='+CONFIG.CASHDESKID);
  return sha256(p1 + p2);
}

function genConfirm(userId){ return md5(userId+':'+CONFIG.HASH); }

// ============================================
// TELEGRAM
// ============================================
async function sendTelegram(text, keyboard, chatId, token){
  const targetChatId = chatId || CONFIG.TELEGRAM_CHAT_ID;
  const targetToken = token || CONFIG.TELEGRAM_TOKEN;
  const body = { chat_id: targetChatId, text: text, parse_mode: 'HTML' };
  if(keyboard) body.reply_markup = { inline_keyboard: keyboard };
  try {
    const res = await fetch('https://api.telegram.org/bot'+targetToken+'/sendMessage', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(!data.ok) console.log('[TELEGRAM ERROR]', JSON.stringify(data));
  } catch(e){ console.log('[TELEGRAM ERROR]', e.message); }
}

// ============================================
// PING
// ============================================
app.get('/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ============================================
// DEPOT
// ============================================
app.post('/depot', async (req, res) => {
  try {
    const data = req.body;
    const ref = data.ref;
    await db.collection('transactions').doc(ref).set({
      ...data, type: 'depot', statut: 'en_attente',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const msg = '<b>💳 NOUVEAU DÉPÔT</b>\n━━━━━━━━━━━━━━━\n' +
      '👤 <b>Client :</b> '+data.clientNom+'\n' +
      '📱 <b>WhatsApp :</b> '+data.clientWa+'\n' +
      '🔢 <b>ID 1xBet :</b> '+data.clientId1xbet+'\n' +
      '💰 <b>Montant :</b> '+Number(data.montant).toLocaleString('fr-FR')+' GNF\n' +
      '📲 <b>Méthode :</b> '+data.methode+'\n' +
      '🔑 <b>ID Transaction :</b> <code>'+data.idTransaction+'</code>\n' +
      '📋 <b>Réf :</b> <code>'+ref+'</code>\n━━━━━━━━━━━━━━━\n' +
      '⚡ <i>Vérifiez le paiement puis confirmez</i>';
    const keyboard = [[
      { text: '✅ Confirmer et créditer', callback_data: 'confirm_depot_'+ref },
      { text: '❌ Rejeter', callback_data: 'reject_depot_'+ref }
    ]];
    await sendTelegram(msg, keyboard, data.telegramChatId || null, data.telegramToken || null);
    res.json({ success: true, ref: ref });
  } catch(e){ console.error('Erreur depot:', e); res.json({ success: false, message: e.message }); }
});

// ============================================
// RETRAIT
// ============================================
app.post('/retrait', async (req, res) => {
  try {
    const data = req.body;
    const ref = data.ref;
    await db.collection('transactions').doc(ref).set({
      ...data, type: 'retrait', statut: 'en_attente',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const msg = '<b>💰 NOUVEAU RETRAIT</b>\n━━━━━━━━━━━━━━━\n' +
      '👤 <b>Client :</b> '+data.clientNom+'\n' +
      '📱 <b>WhatsApp :</b> '+data.clientWa+'\n' +
      '🔢 <b>ID 1xBet :</b> '+data.clientId1xbet+'\n' +
      '💰 <b>Montant :</b> '+Number(data.montant).toLocaleString('fr-FR')+' GNF\n' +
      '🔑 <b>Code retrait :</b> <code>'+data.codeRetrait+'</code>\n' +
      '📲 <b>Réception :</b> '+data.numeroReception+'\n' +
      '💳 <b>Méthode :</b> '+data.methode+'\n' +
      '📋 <b>Réf :</b> <code>'+ref+'</code>\n━━━━━━━━━━━━━━━\n' +
      '⚡ <i>Vérifiez et traitez le retrait</i>';
    const keyboard = [[
      { text: '✅ Confirmer le retrait', callback_data: 'confirm_retrait_'+ref },
      { text: '❌ Rejeter', callback_data: 'reject_retrait_'+ref }
    ]];
    await sendTelegram(msg, keyboard, data.telegramChatId || null, data.telegramToken || null);
    res.json({ success: true, ref: ref });
  } catch(e){ console.error('Erreur retrait:', e); res.json({ success: false, message: e.message }); }
});

// ============================================
// HANDLER WEBHOOK COMMUN
// ============================================
async function handleWebhook(update, botToken){
  if(!update.callback_query) return;
  const query = update.callback_query;
  const cbData = query.data;

  // Répondre immédiatement à Telegram
  await fetch('https://api.telegram.org/bot'+botToken+'/answerCallbackQuery', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ callback_query_id: query.id })
  });

  // ---- DÉPÔT CONFIRMÉ ----
  if(cbData.startsWith('confirm_depot_')){
    const ref = cbData.replace('confirm_depot_', '');
    const doc = await db.collection('transactions').doc(ref).get();
    if(!doc.exists){ await sendTelegram('⚠️ Transaction <code>'+ref+'</code> introuvable.', null, null, botToken); return; }
    const depot = doc.data();
    const chatId = depot.telegramChatId || null;
    if(depot.statut !== 'en_attente'){
      await sendTelegram('⚠️ Transaction <code>'+ref+'</code> déjà traitée.', null, chatId, botToken); return;
    }
    if(!CONFIG.HASH){
      await db.collection('transactions').doc(ref).update({ statut: 'confirme_test' });
      await sendTelegram('✅ <b>DÉPÔT CONFIRMÉ (mode test)</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+depot.clientNom+'\n💰 '+Number(depot.montant).toLocaleString('fr-FR')+' GNF\n\n<i>⚠️ API MobCash non configurée</i>', null, chatId, botToken);
      return;
    }
    try {
      const lng = 'ru';
      const userId = depot.clientId1xbet;
      const montant = parseFloat(depot.montant);
      const sign = genSignDepot(lng, userId, montant);
      const confirm = genConfirm(userId);
      const reqBody = { cashdeskid: parseInt(CONFIG.CASHDESKID), lng: lng, summa: montant, confirm: confirm };
      console.log('[DEPOT REQUEST] body='+JSON.stringify(reqBody));
      const response = await fetch(CONFIG.MOBCASH_URL+'/Deposit/'+userId+'/Add', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'sign': sign},
        body: JSON.stringify(reqBody)
      });
      const result = await response.json();
      console.log('[MOBCASH RESPONSE]', JSON.stringify(result));
      if(result.success || result.Success){
        await db.collection('transactions').doc(ref).update({ statut: 'credite', creditedAt: admin.firestore.FieldValue.serverTimestamp() });
        await sendTelegram('✅ <b>DÉPÔT CRÉDITÉ avec succès !</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+depot.clientNom+'\n💰 '+Number(depot.montant).toLocaleString('fr-FR')+' GNF\n🎯 ID 1xBet: '+userId, null, chatId, botToken);
      } else {
        await sendTelegram('❌ <b>Erreur MobCash</b>\nErreur: '+(result.Message||result.message||'Inconnue')+'\nCode: '+(result.MessageId||result.messageId||''), null, chatId, botToken);
      }
    } catch(e){ await sendTelegram('❌ Erreur serveur: '+e.message, null, chatId, botToken); }
  }

  // ---- DÉPÔT REJETÉ ----
  else if(cbData.startsWith('reject_depot_')){
    const ref = cbData.replace('reject_depot_', '');
    const doc = await db.collection('transactions').doc(ref).get();
    const depot = doc.exists ? doc.data() : {};
    const chatId = depot.telegramChatId || null;
    await db.collection('transactions').doc(ref).update({ statut: 'rejete' });
    await sendTelegram('❌ <b>DÉPÔT REJETÉ</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+(depot.clientNom||'Inconnu')+'\n<i>Contactez le client: '+(depot.clientWa||'')+'</i>', null, chatId, botToken);
  }

  // ---- RETRAIT CONFIRMÉ ----
  else if(cbData.startsWith('confirm_retrait_')){
    const ref = cbData.replace('confirm_retrait_', '');
    const doc = await db.collection('transactions').doc(ref).get();
    if(!doc.exists){ await sendTelegram('⚠️ Transaction <code>'+ref+'</code> introuvable.', null, null, botToken); return; }
    const retrait = doc.data();
    const chatId = retrait.telegramChatId || null;
    if(retrait.statut !== 'en_attente'){
      await sendTelegram('⚠️ Transaction <code>'+ref+'</code> déjà traitée.', null, chatId, botToken); return;
    }
    if(!CONFIG.HASH){
      await db.collection('transactions').doc(ref).update({ statut: 'confirme_test' });
      await sendTelegram('✅ <b>RETRAIT CONFIRMÉ (mode test)</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+retrait.clientNom+'\n💰 '+Number(retrait.montant).toLocaleString('fr-FR')+' GNF\n📲 Envoyez au: '+retrait.numeroReception, null, chatId, botToken);
      return;
    }
    try {
      const lng = 'ru';
      const userId = retrait.clientId1xbet;
      const sign = genSignRetrait(lng, userId, retrait.codeRetrait);
      const confirm = genConfirm(userId);
      const response = await fetch(CONFIG.MOBCASH_URL+'/Deposit/'+userId+'/Payout', {
        method: 'POST', headers: {'Content-Type': 'application/json', 'sign': sign},
        body: JSON.stringify({ cashdeskId: parseInt(CONFIG.CASHDESKID), lng: lng, code: retrait.codeRetrait, confirm: confirm })
      });
      const result = await response.json();
      console.log('[MOBCASH RETRAIT]', JSON.stringify(result));
      if(result.success || result.Success){
        await db.collection('transactions').doc(ref).update({ statut: 'traite', processedAt: admin.firestore.FieldValue.serverTimestamp() });
        await sendTelegram('✅ <b>RETRAIT TRAITÉ !</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+retrait.clientNom+'\n💰 '+Number(result.Summa||result.summa||retrait.montant).toLocaleString('fr-FR')+' GNF\n📲 Envoyez au: '+retrait.numeroReception+' via '+retrait.methode, null, chatId, botToken);
      } else {
        await sendTelegram('❌ <b>Erreur MobCash retrait</b>\nErreur: '+(result.Message||result.message||'Inconnue'), null, chatId, botToken);
      }
    } catch(e){ await sendTelegram('❌ Erreur serveur: '+e.message, null, chatId, botToken); }
  }

  // ---- RETRAIT REJETÉ ----
  else if(cbData.startsWith('reject_retrait_')){
    const ref = cbData.replace('reject_retrait_', '');
    const doc = await db.collection('transactions').doc(ref).get();
    const retrait = doc.exists ? doc.data() : {};
    const chatId = retrait.telegramChatId || null;
    await db.collection('transactions').doc(ref).update({ statut: 'rejete' });
    await sendTelegram('❌ <b>RETRAIT REJETÉ</b>\n📋 Réf: <code>'+ref+'</code>\n👤 '+(retrait.clientNom||'Inconnu')+'\n<i>Contactez le client: '+(retrait.clientWa||'')+'</i>', null, chatId, botToken);
  }
}

// ============================================
// WEBHOOKS
// ============================================
// Webhook principal (votre bot)
app.post('/webhook', async (req, res) => {
  res.json({ ok: true });
  await handleWebhook(req.body, CONFIG.TELEGRAM_TOKEN);
});

// Webhook bot Joseph
app.post('/webhook/joseph', async (req, res) => {
  res.json({ ok: true });
  await handleWebhook(req.body, '7979158544:AAG5_MhnoMZ0UpIzU0GC_mEpDIFYqi1l31s');
});

// ============================================
// SOLDE CAISSE
// ============================================
app.get('/balance', async (req, res) => {
  if(!CONFIG.HASH) return res.json({ success: false, message: 'API MobCash non configurée' });
  try {
    const dt = new Date().toISOString().replace('T', ' ').substr(0, 19);
    const p1 = sha256('hash='+CONFIG.HASH+'&cashdeskid='+CONFIG.CASHDESKID+'&dt='+dt);
    const p2 = md5('dt='+dt+'&cashierpass='+CONFIG.CASHIERPASS+'&cashdeskid='+CONFIG.CASHDESKID);
    const sign = sha256(p1 + p2);
    const confirm = md5(CONFIG.CASHDESKID+':'+CONFIG.HASH);
    const url = CONFIG.MOBCASH_URL+'/Cashdesk/'+CONFIG.CASHDESKID+'/Balance?confirm='+confirm+'&dt='+encodeURIComponent(dt);
    const response = await fetch(url, { headers: { sign: sign } });
    const data = await response.json();
    res.json({ success: true, data: data });
  } catch(e){ res.json({ success: false, message: e.message }); }
});

// ============================================
// DÉMARRAGE
// ============================================
const PORT = process.env.PORT || 3000;
const RENDER_URL = process.env.RENDER_URL || 'https://mobcash-server.onrender.com';

app.listen(PORT, async () => {
  console.log('Serveur MobCash démarré sur le port '+PORT);
  try {
    // Webhook votre bot
    await fetch('https://api.telegram.org/bot'+CONFIG.TELEGRAM_TOKEN+'/setWebhook', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url: RENDER_URL+'/webhook' })
    });
    console.log('Webhook principal configuré');
    // Webhook bot Joseph
    await fetch('https://api.telegram.org/bot7979158544:AAG5_MhnoMZ0UpIzU0GC_mEpDIFYqi1l31s/setWebhook', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ url: RENDER_URL+'/webhook/joseph' })
    });
    console.log('Webhook Joseph configuré');
  } catch(e){ console.warn('Webhook erreur:', e.message); }
});

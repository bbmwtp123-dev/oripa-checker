const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  // テキストとスライダーの同期セットアップ
  setupSyncProb('smallProbTxt', 'smallProbSlider', 'smallProbBadge');
  setupSyncProb('loseProbTxt', 'loseProbSlider', 'loseProbBadge');
  setupSyncProb('midProbTxt', 'midProbSlider', 'midProbBadge');

  // その他の入力項目のイベント
  ['costPerSpin', 'smallCoin', 'loseCoin', 'midCoin', 'totalCount', 'remainCount']
    .forEach(id => $(id).addEventListener('input', compute));

  compute();
});

// ---------------------------
// テキスト入力 ⇔ スライダー連動ロジック
// ---------------------------
function setupSyncProb(txtId, sliderId, badgeId) {
  const txt = $(txtId);
  const slider = $(sliderId);
  
  txt.addEventListener('input', () => {
    const parsed = parseProb(txt.value);
    if (parsed !== null && parsed >= 0 && parsed <= 100) {
      slider.value = parsed;
    } else {
      slider.value = 0;
    }
    compute();
  });

  txt.addEventListener('blur', () => {
    const valStr = txt.value.trim();
    if (valStr && !valStr.includes('/') && !valStr.includes('%')) {
      const parsed = parseProb(valStr);
      if (parsed !== null) txt.value = parsed + '%';
    }
  });

  slider.addEventListener('input', () => {
    let val = parseFloat(slider.value);
    // マグネット機能：整数の近く（±0.4）なら整数に吸着させる
    if (Math.abs(val - Math.round(val)) < 0.4) {
      val = Math.round(val);
      slider.value = val;
    }
    // スライダー操作時は％をつけてテキストボックスに反映
    txt.value = val + '%';
    compute();
  });
}

function parseProb(valStr) {
  if (!valStr) return null;
  valStr = valStr.trim().replace(/%/g, '');
  if (valStr.includes('/')) {
    const parts = valStr.split('/');
    if (parts.length === 2) {
      const n = parseFloat(parts[0]);
      const d = parseFloat(parts[1]);
      if (!isNaN(n) && !isNaN(d) && d !== 0) {
        return (n / d) * 100;
      }
    }
  }
  const n = parseFloat(valStr);
  return isNaN(n) ? null : n;
}

function formatProbBadge(parsedPct, rawStr) {
  if (parsedPct === null || isNaN(parsedPct) || parsedPct <= 0 || parsedPct > 100) return '';
  const str = String(rawStr).trim();
  if (str.includes('/')) {
    return `${parseFloat(parsedPct.toFixed(2))}%`;
  } else {
    const frac = 100 / parsedPct;
    const fStr = (frac % 1 === 0) ? frac.toString() : frac.toFixed(1);
    return `1 / ${fStr}`;
  }
}

function vNum(id) {
  const n = parseFloat($(id).value);
  return isNaN(n) ? null : n;
}
function fmt(n)         { return Math.round(n).toLocaleString(); }
function fmtDec(n, d=1) { return (+n).toFixed(d); }

function posToColor(pos) {
  const stops = [
    [255,  77, 109],  // 0: 赤
    [255, 144,  64],  // 25: オレンジ
    [255, 215,  64],  // 50: 黄
    [160, 224,  80],  // 75: 黄緑
    [  0, 230, 118],  // 100: 緑
  ];
  const idx = (pos / 100) * (stops.length - 1);
  const Math_floor = Math.floor(idx);
  const lo = Math.max(0, Math.min(Math_floor, stops.length - 2));
  const hi = lo + 1;
  const t  = idx - lo;
  const [r1,g1,b1] = stops[lo];
  const [r2,g2,b2] = stops[hi];
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function tsukkomi(breakEven, cost, realCost) {
  if (realCost <= 0) return '「え、これ引くだけで平均して儲かる設計じゃん！」……本当にそんな甘い話あるの？';
  const ratio = breakEven / cost;
  if (ratio < 3)   return '「小当たりだけでもう元が取れそう……」設定ミスを疑うレベルです。';
  if (ratio < 7)   return '「この金額なら、普通に当たる景品で余裕で超えるじゃん！」優良オリパの予感。';
  if (ratio < 15)  return '「大当たりのラインナップ次第では、全然勝負できる金額だね」要確認です。';
  if (ratio < 25)  return '「……いや、そんな価値の大当たり、そうそう入ってないぞ？」深追いは禁物。';
  if (ratio < 40)  return '「それ、PSA10のトップレアでもギリギリじゃないですか……？」かなりキツい設定。';
  if (ratio < 80)  return '「いや、そんなの的中させられんわ！！」……そんな超高額な景品、バナーに入ってません。';
  return '「狂気の設定」……運営に寄付するつもりで引く以外、そっとタブを閉じましょう。';
}

// ---------------------------
// ツッコミ・演出
// ---------------------------
function tsukkomi(borderAmount, cost, realCost, isTotal) {
  if (realCost <= 0) return '「え、これ引くだけで平均して儲かる設計じゃん！」……バグを疑うレベル。';
  
  const lossRatio = realCost / cost; // 1回あたりの損失率
  
  if (isTotal) {
    if (lossRatio < 0.2) return '「箱買いしてもこの程度のマイナスで済むなら、大当たりの価値次第で全然プラスになる優良設定！」';
    if (lossRatio < 0.5) return '「このマイナス額と、目玉景品の合計相場を比べてみてください。目玉が上回っていれば買いです。」';
    if (lossRatio < 0.8) return '「かなり持っていかれます。大当たり枠に超高額カードがゴロゴロ入っていないと割に合いません。」';
    return '「箱買いしたら大惨事！トップレアが数枚あっても到底捲れない、運営丸儲けの設定です。」';
  } else {
    if (lossRatio < 0.2) return '「100連してもこれしか削られないの！？ 1〜2万円の当たりを引くだけで捲れる超甘口設定！」';
    if (lossRatio < 0.5) return '「100連の負債としては標準的。バナーにこの金額以上の景品がちゃんと入っているか確認を。」';
    if (lossRatio < 0.8) return '「100連でこの負債は結構痛い。10万〜20万クラスのトップレアを引かないと致命傷になります。」';
    return '「100回引くだけでこのマイナス！？ 宝くじ並の極悪設定。絶対に深追いしてはいけません。」';
  }
}

function verdictText(realCost, cost) {
  const lossRatio = realCost / cost; 
  if (realCost <= 0) return { cls:'good', em:'🎉', title:'超甘！無条件で引くべき', sub:`実質出費がマイナス（${fmtDec(realCost)}コイン）。理論上、引けば引くほど得をするバグレベルの設定です。` };
  if (lossRatio < 0.25) return { cls:'good', em:'🎯', title:'激アツ！優良な甘口設定', sub:`ベース還元率が非常に高く、傷が浅く済みます。大当たりのハードルが低く、狙いやすいオリパです。` };
  if (lossRatio < 0.55) return { cls:'warn', em:'🤔', title:'ボーダーライン…',       sub:`一般的な還元率。「必要な大当たりの価値」以上の景品が十分に入っているかが勝負の分かれ目です。` };
  if (lossRatio < 0.8)  return { cls:'bad',  em:'🚨', title:'渋い！見送り推奨（辛口）', sub:`ベースの回収率が悪く、ハズレが続くと一瞬で資金が溶けます。トップレア狙いの特攻以外は危険。` };
  return                { cls:'bad',  em:'💀', title:'ドハズレ設定。全力で逃げろ', sub:`還元率が最悪レベル。お金をドブに捨てるのと同じです。よほど運に自信がある人以外は手を出さないで。` };
}

function updateMeterUI(pos, text, color) {
  const meter   = $('sweetMeter');
  const tooltip = $('meterTooltip');
  
  meter.value = pos;
  
  let styleEl = document.getElementById('_meterStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = '_meterStyle';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    #sweetMeter::-webkit-slider-thumb { background: ${color} !important; border-color: rgba(255,255,255,0.9) !important; }
    #sweetMeter::-moz-range-thumb     { background: ${color} !important; border-color: rgba(255,255,255,0.9) !important; }
  `;

  const thumbR = 14; 
  const pct = pos / 100;
  tooltip.style.left = `calc(${pct * 100}% + ${thumbR - pct * 2 * thumbR}px)`;
  tooltip.style.borderColor = color;
  tooltip.style.borderTopColor = color;
  tooltip.textContent = text;
}

// ---------------------------
// メイン計算処理
// ---------------------------
function compute() {
  const cost      = vNum('costPerSpin');
  const smallCoin = vNum('smallCoin');
  const smallProbStr = $('smallProbTxt').value;
  const smallProb = parseProb(smallProbStr);

  const sBadge = $('smallProbBadge');
  if (smallProb !== null) {
    sBadge.textContent = formatProbBadge(smallProb, smallProbStr);
    sBadge.classList.remove('is-empty');
  } else {
    sBadge.classList.add('is-empty');
  }

  if (cost === null || smallCoin === null || smallProb === null) {
    $('resultTop').style.display  = 'none';
    $('emptyState').style.display = 'block';
    updateMeterUI(50, '価格と小当たり（コイン・確率）を入力してください', '#888');
    return;
  }

  $('resultTop').style.display  = 'block';
  $('emptyState').style.display = 'none';

  const loseCoin = vNum('loseCoin');
  const loseProbStr = $('loseProbTxt').value;
  const loseProb = parseProb(loseProbStr);
  const midCoin  = vNum('midCoin');
  const midProbStr = $('midProbTxt').value;
  const midProb  = parseProb(midProbStr);
  
  const totalCnt = vNum('totalCount');
  const remainCnt = vNum('remainCount');

  const sp = smallProb / 100;
  const mp = midProb !== null ? midProb / 100 : 0;
  
  let lp = 0;
  const lBadge = $('loseProbBadge');
  if (loseProb !== null) {
    lp = loseProb / 100;
    lBadge.textContent = formatProbBadge(loseProb, loseProbStr);
    lBadge.classList.remove('is-empty');
  } else {
    lp = Math.max(0, 1 - sp - mp);
    lBadge.textContent = `自動計算: ${fmtDec(lp*100)}%`;
    lBadge.classList.remove('is-empty');
    $('loseProbSlider').value = lp * 100; 
  }

  const mBadge = $('midProbBadge');
  if (midProb !== null) {
    mBadge.textContent = formatProbBadge(midProb, midProbStr);
    mBadge.classList.remove('is-empty');
  } else {
    mBadge.classList.add('is-empty');
  }
  
  const lc = loseCoin !== null ? loseCoin : 0;
  const mc = midCoin  !== null ? midCoin  : 0;

  // 実計算
  const avgRecover = (lc * lp) + (smallCoin * sp) + (mc * mp);
  const realCost   = cost - avgRecover;
  
  // ボーダー計算（総口数がある場合は全部買い、ない場合は100連）
  let borderAmount = 0;
  let isTotal = false;
  if (totalCnt !== null && totalCnt > 0) {
    document.querySelector('.bc-eyebrow').textContent = `全部買い（${fmt(totalCnt)}口）した場合、大当たり枠に求められる合計価値`;
    borderAmount = realCost * totalCnt;
    isTotal = true;
  } else {
    document.querySelector('.bc-eyebrow').textContent = `100連（まとめ引き）した場合、大当たりで取り返すべき額（実質負債）`;
    borderAmount = realCost * 100;
  }

  // メーターのポジション (ベース還元率%と完全にリンク)
  let pos = 0;
  if (realCost <= 0) {
    pos = 100;
  } else {
    const returnRate = avgRecover / cost;
    pos = Math.max(0, Math.min(100, Math.round(returnRate * 100)));
  }
  const levels = [
    [0,  20,  '💀 ドハズレ'], 
    [20, 35,  '🚨 かなり渋い'], 
    [35, 45,  '😰 渋め'],
    [45, 60,  '⚖️ ボーダーライン'], 
    [60, 75,  '🙂 やや甘い'], 
    [75, 90,  '🎯 甘い！'],
    [90, 101, '🎉 激アツ！'],
  ];
  const found = levels.find(([lo, hi]) => pos >= lo && pos < hi);
  updateMeterUI(pos, found ? found[2] : '—', posToColor(pos));

  // 結果反映
  $('bcVal').textContent      = '¥' + fmt(borderAmount);
  $('bcTsukkomi').textContent = tsukkomi(borderAmount, cost, realCost, isTotal);
  
  $('kRecoverVal').textContent = fmtDec(avgRecover) + ' コイン';
  $('kCostVal').textContent    = fmtDec(realCost)   + ' コイン';

  let noteArr = [`小当たり${fmtDec(sp*100)}%`, `ハズレ${fmtDec(lp*100)}%`];
  if (mp > 0) noteArr.splice(1, 0, `中当たり${fmtDec(mp*100)}%`);
  $('kRecoverNote').textContent = noteArr.join(' / ') + ' で計算';

  const rb = $('remainBox');
  if (totalCnt !== null && remainCnt !== null && remainCnt <= totalCnt) {
    const rTotal   = remainCnt * cost;
    const rRecover = remainCnt * avgRecover;
    const rCost    = rTotal - rRecover;
    $('rTotal').textContent   = '¥' + fmt(rTotal);
    $('rRecover').textContent = '¥' + fmt(rRecover);
    $('rCost').textContent    = '¥' + fmt(rCost);
    rb.style.display = 'block';
  } else {
    rb.style.display = 'none';
  }

  const vc = $('verdictCard');
  vc.classList.remove('good','warn','bad');
  const vd = verdictText(realCost, cost);
  vc.classList.add(vd.cls);
  $('vcEm').textContent    = vd.em;
  $('vcTitle').textContent = vd.title;
  $('vcSub').textContent   = vd.sub;
}

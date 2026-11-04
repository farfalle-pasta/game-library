// ===================================
// マナの森 - ゲームシステム
// ===================================

// セーブデータの保存名
const SAVE_KEY = "manaForestSave";

// プレイヤーデータ
const player = {
  coins: 0,
  gatheringAbility: 0,
  inventoryCapacity: 10,
  inventoryExpansionCount: 0,
  inventory: [],

  // 図鑑に登録された素材ID
  discoveredMaterials: [],

  // 素材ごとの累計採集数
  gatheringCounts: {}
};

// 選択中の個体
let selectedItemId = null;

// ===================================
// 素材データ
// ===================================


const materials = [
  // ☆1 フローラ
  {
    id: "young_leaf",
    name: "若葉",
    rarity: "☆1",
    baseValue: 30,
    weight: 12
  },
  {
    id: "white_clover",
    name: "シロツメ草",
    rarity: "☆1",
    baseValue: 30,
    weight: 12
  },
  {
    id: "wild_strawberry",
    name: "野いちご",
    rarity: "☆1",
    baseValue: 30,
    weight: 12
  },
  {
    id: "acorn",
    name: "どんぐり",
    rarity: "☆1",
    baseValue: 30,
    weight: 12
  },
  {
    id: "fern_leaf",
    name: "シダの葉",
    rarity: "☆1",
    baseValue: 30,
    weight: 12
  },

  // ☆2 フォンス
  {
    id: "forest_fruit",
    name: "森の実",
    rarity: "☆2",
    baseValue: 40,
    weight: 6.25
  },
  {
    id: "small_fruit",
    name: "小さな木の実",
    rarity: "☆2",
    baseValue: 40,
    weight: 6.25
  },
  {
    id: "plump_mushroom",
    name: "ふっくらキノコ",
    rarity: "☆2",
    baseValue: 40,
    weight: 6.25
  },
  {
    id: "pink_flower",
    name: "桃色の花",
    rarity: "☆2",
    baseValue: 40,
    weight: 6.25
  },

  // ☆3 アニマ
  {
    id: "green_glow_flower",
    name: "翠光花",
    rarity: "☆3",
    baseValue: 52,
    weight: 10 / 3
  },
  {
    id: "amber_fruit",
    name: "琥珀の実",
    rarity: "☆3",
    baseValue: 52,
    weight: 10 / 3
  },
  {
    id: "blue_glow_mushroom",
    name: "蒼光キノコ",
    rarity: "☆3",
    baseValue: 52,
    weight: 10 / 3
  },

  // ☆4 ルクス
  {
    id: "star_bloom",
    name: "星咲きの花",
    rarity: "☆4",
    baseValue: 65,
    weight: 2
  },
  {
    id: "golden_mushroom",
    name: "黄金キノコ",
    rarity: "☆4",
    baseValue: 65,
    weight: 2
  },

  // ☆5 アルカナ
  {
    id: "forest_spirit_flower",
    name: "森の精霊花",
    rarity: "☆5",
    baseValue: 80,
    weight: 1
  }
];


// 図鑑のレアリティ分類
const rarities = ["☆1", "☆2", "☆3", "☆4", "☆5"];

// ===================================
// セーブ・ロード
// ===================================

// ゲームデータを保存
function saveGame() {
  const saveData = {
    coins: player.coins,
    gatheringAbility: player.gatheringAbility,
    inventoryCapacity: player.inventoryCapacity,
    inventoryExpansionCount: player.inventoryExpansionCount,
    inventory: player.inventory,

    // 図鑑データ
    discoveredMaterials: player.discoveredMaterials,
    gatheringCounts: player.gatheringCounts
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error("セーブに失敗しました。", error);
  }
}

// ゲームデータを読み込み
function loadGame() {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);

    if (!savedData) {
      return;
    }

    const data = JSON.parse(savedData);

    if (
      typeof data !== "object" ||
      data === null ||
      !Array.isArray(data.inventory)
    ) {
      return;
    }

    // プレイヤーデータを復元
    player.coins =
      Number.isFinite(data.coins) ? data.coins : 0;

    player.gatheringAbility =
  Number.isFinite(data.gatheringAbility)
    ? Math.round(
        Math.min(50, Math.max(0, data.gatheringAbility)) * 10
      ) / 10
    : 0;

    player.inventoryCapacity =
      Number.isFinite(data.inventoryCapacity)
        ? Math.max(10, data.inventoryCapacity)
        : 10;

    player.inventoryExpansionCount =
      Number.isFinite(data.inventoryExpansionCount)
        ? Math.max(0, data.inventoryExpansionCount)
        : 0;

    player.inventory = data.inventory.filter(item =>
      item &&
      materials.some(material => material.id === item.materialId) &&
      Number.isFinite(item.value) &&
      item.value >= 10 &&
      item.value <= 100
    );

    // 既存個体のレアリティを新しい星ランクに更新
    player.inventory.forEach(item => {
      const material = materials.find(
        material => material.id === item.materialId
      );

      if (material) {
        item.rarity = material.rarity;
      }
    });

    // 容量を超えるデータは読み込まない
    player.inventory = player.inventory.slice(
      0,
      player.inventoryCapacity
    );

    // ===================================
    // 図鑑データの読み込み
    // ===================================

    if (Array.isArray(data.discoveredMaterials)) {
      player.discoveredMaterials = data.discoveredMaterials.filter(
        id => materials.some(material => material.id === id)
      );
    } else {
      // 図鑑追加前のセーブデータの場合、
      // 現在所持している素材を発見済みにする
      player.discoveredMaterials = [];
    }

    // 既存の所持素材を発見済みにする
    player.inventory.forEach(item => {
      if (!player.discoveredMaterials.includes(item.materialId)) {
        player.discoveredMaterials.push(item.materialId);
      }
    });

    // 素材ごとの採集数を読み込み
    player.gatheringCounts = {};

    if (
      data.gatheringCounts &&
      typeof data.gatheringCounts === "object" &&
      !Array.isArray(data.gatheringCounts)
    ) {
      materials.forEach(material => {
        const count = data.gatheringCounts[material.id];

        player.gatheringCounts[material.id] =
          Number.isInteger(count) && count >= 0
            ? count
            : 0;
      });
    }

    console.log("セーブデータを読み込みました。");

  } catch (error) {
    console.error("ロードに失敗しました。", error);
  }
}

// ===================================
// タブ切り替え
// ===================================

function changeScreen(screenId) {
  document.querySelectorAll(".game-screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");

  document.querySelectorAll(".nav-button").forEach(button => {
    button.classList.remove("active");
  });

  document.querySelector(
    `.nav-button[data-screen="${screenId}"]`
  ).classList.add("active");

  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-button").forEach(button => {
  button.addEventListener("click", () => {
    changeScreen(button.dataset.screen);
  });
});

// ===================================
// 素材の抽選
// ===================================

function drawMaterial() {
  const lottery = materials.map(material => ({
    ...material,
    adjustedWeight:
      material.weight + player.gatheringAbility
  }));

  const totalWeight = lottery.reduce(
    (sum, material) => sum + material.adjustedWeight,
    0
  );

  let random = Math.random() * totalWeight;

  for (const material of lottery) {
    random -= material.adjustedWeight;

    if (random < 0) {
      return material;
    }
  }

  return lottery[0];
}

// ===================================
// 個体値の生成
// ===================================

function generateIndividualValue(baseValue) {
  const randomValue = Math.floor(Math.random() * 41) - 20;

  return baseValue + randomValue;
}

// ===================================
// 図鑑への登録・採集数カウント
// ===================================

function recordGathering(material) {
  // 初めて採集した素材を図鑑に登録
  if (!player.discoveredMaterials.includes(material.id)) {
    player.discoveredMaterials.push(material.id);
  }

  // 採集数を1増やす
  if (!Number.isInteger(player.gatheringCounts[material.id])) {
    player.gatheringCounts[material.id] = 0;
  }

  player.gatheringCounts[material.id]++;
}

// ===================================
// 採集処理
// ===================================

function gatherMaterial() {
  if (player.inventory.length >= player.inventoryCapacity) {
    showResult("インベントリがいっぱいです！素材を整理しましょう。");
    return;
  }

  const material = drawMaterial();

  const individualValue = generateIndividualValue(
    material.baseValue
  );

  const item = {
    id: Date.now() + Math.random(),
    materialId: material.id,
    name: material.name,
    rarity: material.rarity,
    value: individualValue
  };

  player.inventory.push(item);

  // 図鑑登録と採集数の更新
  recordGathering(material);

  showResult(
    `${material.name}を採集しました！<br>` +
    `マナ：${individualValue}`
  );

  updateDisplay();
}

// ===================================
// 採集結果の表示
// ===================================

function showResult(message) {
  document.getElementById("gather-result").innerHTML = message;
}

// ===================================
// 個体の計算
// ===================================

// 売却金額
function getSellPrice(item) {
  return Math.floor(item.value * item.value / 100);
}

// 強化量（小数第1位まで）
function getUpgradeValue(item) {
  return Math.floor(
    item.value * item.value / 100
  ) / 10;
}

// 強化費用
function getUpgradeCost(item) {
  return item.value * 10;
}

// ===================================
// インベントリ表示
// ===================================

function updateInventory() {
  const inventoryList = document.getElementById("inventory-list");

  if (player.inventory.length === 0) {
    inventoryList.textContent = "まだ素材を持っていません。";
    return;
  }

  const groupedItems = {};

  for (const item of player.inventory) {
    if (!groupedItems[item.materialId]) {
      groupedItems[item.materialId] = [];
    }

    groupedItems[item.materialId].push(item);
  }

  inventoryList.innerHTML = "";

  for (const material of materials) {
    const items = groupedItems[material.id];

    if (!items || items.length === 0) {
      continue;
    }

    const group = document.createElement("details");
    group.className = "inventory-group";

    const summary = document.createElement("summary");
    summary.textContent = `${material.name} × ${items.length}`;

    group.appendChild(summary);

    const itemContainer = document.createElement("div");
    itemContainer.className = "inventory-items";

    for (const item of items) {
      const card = document.createElement("div");
      card.className = "inventory-item";
      card.dataset.itemId = item.id;

      const mana = document.createElement("strong");
      mana.textContent = `マナ ${item.value}`;

      const price = document.createElement("span");
      price.className = "inventory-price";
      price.textContent = `🪙${getSellPrice(item)}コイン`;

      card.appendChild(mana);
      card.appendChild(price);

      itemContainer.appendChild(card);
    }

    group.appendChild(itemContainer);
    inventoryList.appendChild(group);
  }
}

// ===================================
// 素材図鑑
// ===================================

function updateEncyclopedia() {
  const encyclopediaList =
    document.getElementById("encyclopedia-list");

  encyclopediaList.innerHTML = "";

  // レアリティごとに分類
  for (const rarity of rarities) {
    const group = document.createElement("section");
    group.className = "encyclopedia-group";

    const title = document.createElement("h3");
    title.className = "encyclopedia-group-title";
    title.textContent = rarity;

    group.appendChild(title);

    const itemContainer = document.createElement("div");
    itemContainer.className = "encyclopedia-items";

    // 該当レアリティの素材を取得
    const rarityMaterials = materials.filter(
      material => material.rarity === rarity
    );

    if (rarityMaterials.length === 0) {
      const empty = document.createElement("p");
      empty.className = "encyclopedia-empty";
      empty.textContent = "まだ素材がありません。";

      itemContainer.appendChild(empty);
    }

    for (const material of rarityMaterials) {
      const isDiscovered =
        player.discoveredMaterials.includes(material.id);

      const card = document.createElement("div");
      card.className = "encyclopedia-item";

      const info = document.createElement("div");
      info.className = "encyclopedia-item-info";

      const name = document.createElement("strong");
      name.className = "encyclopedia-item-name";

      const count = document.createElement("span");
      count.className = "encyclopedia-item-count";

      const status = document.createElement("span");
      status.className = "encyclopedia-status";

      if (isDiscovered) {
        name.textContent = material.name;

        const gatheringCount =
          player.gatheringCounts[material.id] || 0;

        count.textContent = `採集数：${gatheringCount}回`;
        status.textContent = "発見済み";
      } else {
        name.textContent = "？？？";
        name.classList.add("encyclopedia-undiscovered");

        count.textContent = "未発見";
        status.textContent = "未発見";
        status.classList.add("locked");
      }

      info.appendChild(name);
      info.appendChild(count);

      card.appendChild(info);
      card.appendChild(status);

      itemContainer.appendChild(card);
    }

    group.appendChild(itemContainer);
    encyclopediaList.appendChild(group);
  }
}

// ===================================
// 個体詳細画面
// ===================================

function openItemDetails(itemId) {
  const item = player.inventory.find(
    item => String(item.id) === String(itemId)
  );

  if (!item) {
    return;
  }

  selectedItemId = item.id;

  const sellPrice = getSellPrice(item);
  const upgradeCost = getUpgradeCost(item);

  const upgradeValue = Math.min(
    getUpgradeValue(item),
    50 - player.gatheringAbility
  );

  document.getElementById("detail-name").textContent =
    item.name;

  document.getElementById("detail-value").textContent =
    item.value;

  document.getElementById("detail-sell-price").textContent =
    `${sellPrice}コイン`;

  document.getElementById("detail-upgrade-value").textContent =
    `+${upgradeValue.toFixed(1)}`;

  document.getElementById("detail-upgrade-cost").textContent =
    `${upgradeCost}コイン`;

  document.getElementById("detail-message").textContent = "";

  const sellButton = document.getElementById("sell-button");
  const upgradeButton = document.getElementById("upgrade-button");

  sellButton.disabled = false;

  upgradeButton.disabled =
    player.coins < upgradeCost ||
    player.gatheringAbility >= 50;

  if (player.gatheringAbility >= 50) {
    document.getElementById("detail-message").textContent =
      "採集能力は最大レベルです。";
  } else if (player.coins < upgradeCost) {
    document.getElementById("detail-message").textContent =
      "強化に必要なコインが足りません。";
  }

  document.getElementById("item-modal").classList.add("active");
}

// 詳細画面を閉じる
function closeItemDetails() {
  selectedItemId = null;

  document.getElementById("item-modal").classList.remove("active");
}

// ===================================
// 個体の売却
// ===================================

function sellItem() {
  if (selectedItemId === null) {
    return;
  }

  const itemIndex = player.inventory.findIndex(
    item => String(item.id) === String(selectedItemId)
  );

  if (itemIndex === -1) {
    return;
  }

  const item = player.inventory[itemIndex];
  const price = getSellPrice(item);

  player.coins += price;

  player.inventory.splice(itemIndex, 1);

  closeItemDetails();
  updateDisplay();
}

// ===================================
// 個体を使った強化
// ===================================

function upgradeItem() {
  if (selectedItemId === null) {
    return;
  }

  const itemIndex = player.inventory.findIndex(
    item => String(item.id) === String(selectedItemId)
  );

  if (itemIndex === -1) {
    return;
  }

  const item = player.inventory[itemIndex];
  const cost = getUpgradeCost(item);

  if (player.coins < cost) {
    document.getElementById("detail-message").textContent =
      "コインが足りません。";
    return;
  }

  if (player.gatheringAbility >= 50) {
    document.getElementById("detail-message").textContent =
      "採集能力は最大レベルです。";
    return;
  }

  const amount = Math.min(
    getUpgradeValue(item),
    50 - player.gatheringAbility
  );

  player.coins -= cost;

  player.gatheringAbility = Math.round(
  (player.gatheringAbility + amount) * 10
) / 10;

  player.inventory.splice(itemIndex, 1);

  closeItemDetails();
  updateDisplay();
}

// ===================================
// 詳細画面のボタン設定
// ===================================

document.getElementById("inventory-list").addEventListener(
  "click",
  event => {
    const card = event.target.closest(".inventory-item");

    if (!card) {
      return;
    }

    openItemDetails(card.dataset.itemId);
  }
);

document.getElementById("sell-button").addEventListener(
  "click",
  sellItem
);

document.getElementById("upgrade-button").addEventListener(
  "click",
  upgradeItem
);

document.getElementById("close-modal-button").addEventListener(
  "click",
  closeItemDetails
);

// ===================================
// ゲームデータ削除
// ===================================

document.getElementById("reset-button").addEventListener(
  "click",
  () => {
    const confirmed = confirm(
      "ゲームデータをすべて削除して、最初から始めますか？"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
);

// ===================================
// インベントリ拡張
// ===================================

function getExpansionCost() {
  return 200 * (player.inventoryExpansionCount + 1);
}

function expandInventory() {
  const cost = getExpansionCost();

  if (player.coins < cost) {
    document.getElementById("expand-message").textContent =
      "コインが足りません。";
    return;
  }

  player.coins -= cost;
  player.inventoryCapacity += 5;
  player.inventoryExpansionCount++;

  document.getElementById("expand-message").textContent =
    "インベントリ容量を5枠拡張しました！";

  updateDisplay();
}

// ===================================
// 画面表示の更新
// ===================================

function updateDisplay() {
  document.getElementById("coins").textContent =
    player.coins;

  document.getElementById("gathering-level").textContent =
    player.gatheringAbility;

  document.getElementById("inventory-count").textContent =
    `${player.inventory.length} / ${player.inventoryCapacity}`;

  updateInventory();
  updateEncyclopedia();

  const cost = getExpansionCost();

  document.getElementById("current-capacity").textContent =
    `${player.inventoryCapacity}枠`;

  document.getElementById("next-capacity").textContent =
    `${player.inventoryCapacity + 5}枠`;

  document.getElementById("capacity-cost").textContent =
    `${cost}コイン`;

  const expandButton = document.getElementById("expand-button");

  expandButton.disabled = player.coins < cost;

  // 表示更新時に自動セーブ
  saveGame();
}

// ===================================
// ボタン設定
// ===================================

document.getElementById("gather-button").addEventListener(
  "click",
  gatherMaterial
);

document.getElementById("expand-button").addEventListener(
  "click",
  expandInventory
);

// ===================================
// ゲーム開始
// ===================================

// 最初に保存データを読み込む
loadGame();

// 読み込んだデータを画面に反映
updateDisplay();

// Раскладывает «плоские» файлы по папкам перед сборкой.
// Имя src__app__cart__page.tsx превращается в src/app/cart/page.tsx.
// Если файлы уже лежат в папках, скрипт ничего не делает.
import fs from "node:fs";
import path from "node:path";

const SEP = "__";
let moved = 0;
for (const name of fs.readdirSync(".")) {
  if (!name.includes(SEP) || !fs.statSync(name).isFile()) continue;
  const target = name.split(SEP).join("/");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.renameSync(name, target);
  moved++;
}
if (moved) console.log(`setup-folders: разложено файлов по папкам: ${moved}`);

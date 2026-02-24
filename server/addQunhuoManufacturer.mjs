import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 鹑火光电详细信息（基于公开资料整理）
const qunhuo = {
  name: '鹑火光电',
  nameEn: 'Qunhuo Photoelectric (FL Perovskite)',
  country: '中国',
  region: '浙江省湖州市德清县',
  foundedYear: 2020,
  website: 'https://www.qunhuoguangdian.com',
  description: '湖州市鹑火光电有限公司，专注于钙钛矿光伏材料、电池组件制备技术及相关高端装备的设计与研发。公司以喷墨打印技术为核心，致力于解决钙钛矿电池量产化的关键工艺难题，已成功交付多条量产级钙钛矿整线设备。2026年1月完成B+轮融资，投资方包括港信资管、宜宾人才基金及四川聚信致远基金。',
  mainProducts: JSON.stringify([
    '钙钛矿喷墨打印设备（第三代，打印速度3000片/小时）',
    '钙钛矿/晶硅叠层电池量产整线设备',
    '钙钛矿薄膜制备工艺解决方案',
    '柔性钙钛矿电池生产装备',
  ]),
  techAchievements: JSON.stringify([
    { title: 'B+轮融资完成', value: '2026年1月，由港信资管、宜宾人才基金、聚信致远基金投资', date: '2026-01-09' },
    { title: '第三代喷墨打印设备交付', value: '打印速度3000片/小时，材料利用率高，适用于量产', date: '2025-07-18' },
    { title: '钙钛矿整线设备出货', value: '成功出货首批量产商业化钙钛矿整线设备，推动产业化进程', date: '2025-02-01' },
    { title: '四川省重点项目', value: '鹑火光电钙钛矿太阳能电池生产装备产业化基地项目列入2026年四川省重点项目', date: '2026-01-20' },
    { title: '空气环境薄膜制备专利申请', value: '申请钙钛矿太阳能电池薄膜制备方法专利，适用于空气环境', date: '2026-02-11' },
  ]),
  stage: 'pilot',
  capacity: '量产级整线设备，单线产能覆盖MW级',
  latestNews: '2026年1月完成B+轮融资；2026年四川省重点项目——钙钛矿太阳能电池生产装备产业化基地项目落地宜宾；第三代喷墨打印设备已交付客户。',
  isActive: true,
  isPinned: true,
  sortOrder: 1,
};

// Check if already exists
const [existing] = await conn.query('SELECT id FROM manufacturers WHERE name = ?', [qunhuo.name]);
if (existing.length > 0) {
  console.log('鹑火光电 already exists, updating...');
  await conn.query(
    `UPDATE manufacturers SET nameEn=?, country=?, region=?, foundedYear=?, website=?, description=?, mainProducts=?, techAchievements=?, stage=?, capacity=?, latestNews=?, isActive=?, isPinned=?, sortOrder=? WHERE name=?`,
    [qunhuo.nameEn, qunhuo.country, qunhuo.region, qunhuo.foundedYear, qunhuo.website, qunhuo.description, qunhuo.mainProducts, qunhuo.techAchievements, qunhuo.stage, qunhuo.capacity, qunhuo.latestNews, qunhuo.isActive, qunhuo.isPinned, qunhuo.sortOrder, qunhuo.name]
  );
  console.log('Updated successfully.');
} else {
  console.log('Inserting 鹑火光电...');
  await conn.query(
    `INSERT INTO manufacturers (name, nameEn, country, region, foundedYear, website, description, mainProducts, techAchievements, stage, capacity, latestNews, isActive, isPinned, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [qunhuo.name, qunhuo.nameEn, qunhuo.country, qunhuo.region, qunhuo.foundedYear, qunhuo.website, qunhuo.description, qunhuo.mainProducts, qunhuo.techAchievements, qunhuo.stage, qunhuo.capacity, qunhuo.latestNews, qunhuo.isActive, qunhuo.isPinned, qunhuo.sortOrder]
  );
  console.log('Inserted successfully.');
}

// Verify
const [rows] = await conn.query('SELECT id, name, isPinned, sortOrder, stage FROM manufacturers WHERE name = ?', [qunhuo.name]);
console.log('Result:', rows[0]);

await conn.end();
console.log('Done!');

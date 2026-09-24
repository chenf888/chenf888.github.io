# custom 自定义词库

将自定义词库 JSON 文件放入本目录，并在 `../index.json` 的 `decks` 数组中注册一条记录即可。

字段格式与 `ngsl.json`、`cet4.json` 一致：

```json
[
  {
    "id": "custom_0001",
    "word": "example",
    "phonetic": "/ɪɡˈzɑːmpl/",
    "pos": "n.",
    "senses": [
      {
        "definition_cn": "例子；实例",
        "definition_en": "a thing that represents a group or kind",
        "examples": [{ "en": "This is a good example.", "cn": "这是一个好例子。" }]
      }
    ],
    "tags": ["custom"],
    "frequency": 0,
    "collocations": [],
    "root_affix": "",
    "forms": [],
    "aliases": []
  }
]
```

约定：

- `id` 全局唯一、长期不变，更新词库不要改动已有 id。
- `word` 非空；`senses` 至少一个；`senses[0].definition_cn` 必填。
- 文件需为 UTF-8 编码的合法 JSON 数组。
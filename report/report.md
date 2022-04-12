# 竞品分析对比结果

测试样张总数 `2737` 个, 版本包括 `v43 ~ v83.1`,

| 版本 | 样张数量 |
| ---- | -------- |
| v43+ | 638      |
| v50+ | 300      |
| v60+ | 111      |
| v70+ | 1149     |
| v80+ | 537      |
| 总数 | 2737     |

| 对比项 | 行空 | MasterGo | 即时设计 | figma |
| ------ | ---- | -------- | -------- | ----- |
| 总数   | 2737 | 2737     | 2736     | 2737  |
| 打开数 | 2737 | 2699-1   | 2726     |       |
| 失败数 | 0    | 28+1     | 10       |       |
| 成功率 | 100% | 98.940%  | 99.635%  |       |

123123## 其它项

| 对比项       | 行空         | figma      | MasterGo   | 即使设计        | Pixso       |
| ------------ | ------------ | ---------- | ---------- | --------------- | ----------- |
| wasm 大小    | 2.78 MB      | 13.0MB     | 13.4 MB    | 7.49MB          | 13.5 MB     |
| 传输大小     | 840KB (gzip) | 2.9MB (br) | 3.3MB (br) | 7.49MB (无压缩) | 4.6 MB (br) |
| 最低支持版本 | v43          | v43        | v56        | v43             | v43         |

## 超复杂文件性能对比(除去图片)

| 样张(原始大小/MB, 不含图片)                        | 行空               | figma    | MasterGo              | 即使设计     | Pixso    |
| -------------------------------------------------- | ------------------ | -------- | --------------------- | ------------ | -------- |
| `10 Error State Illustrations.sketch` (60.1)       | 15.17s             | 无法打开 | 34.04s, 4k 屏无法打开 | 无法打开     | 无法打开 |
| `goonie-market-ui-kit-bugradere.sketch`(8.84)      |                    |          |                       | 4k 无法打开  |          |
| `70-beautiful-illustrations-andy-dao.sketch`(8.41) |                    |          |                       | 效果严重丢失 |          |
| `Web UI Kit 1.7.0.sketch`(7.70)                    | 我方显示略有差异   | 效果丢失 |                       | 效果严重丢失 |          |
| `Interstellar-Flights.sketch`(5.88)                | 能打开, 但是会崩溃 |          | 4k 能打开无法绘制     |              | 无法打开 |
| `AntV.Charts 4.0.sketch`(5.18)                     |                    |          |                       |              |          |
| `iOS 9.3 iPhone UI Kit.sketch`(5.07)               |                    |          |                       |              |          |

兼容上传数据
原始版本无法打开

## 错误

### js.design 无法处理文件, 已经用 v83.1 重新保存过一次也无法处理

- 2137 - v71.2 - rentee-ui-kit-rachelizmarvel.sketch (直接无法解析报错)
- 2362 - v79 - educo-online-learning-app-pixel-navy.sketch (5 分钟超时,无法打开)
- 2367 - v70.6 - gotour-tavel-app-haidangtee.sketch (5 分钟超时,无法打开)
- 2463 - v46.1 - addstract-ui-kit.sketch (5 分钟超时,无法打开)
- 2464 - v46.2 - Addstract Landing Page.sketch (5 分钟超时,无法打开)
- 2501 - v76.1 - video-downloads-app-sadek.sketch (5 分钟超时,无法打开)
- 2618 - v53.2 - onbbi-v9-tomer-offer.sketch (5 分钟超时,无法打开)
- 2694 - v71.2 - I Want to Singapore.sketch (5 分钟超时,无法打开)
- 2721 - v71.2 - Acro Profile UI.sketch (5 分钟超时,无法打开)
- 2735 - v83.1 - 20 Acro Cover.sketch (5 分钟超时,无法打开)

### masterGo 无法处理文件, 低于 v55 版本已经用 v83.1 重新保存一次

> mastergo 会报 "导入文件时候发生未知错误, 请联系客服" , 无法解析文件, 无法上传

- 2690 - v55.2 - 10 Error State Illustrations.sketch (4k 无法打开, 低于 4k 可以)
- 2712 - v71.2 - Minimal UI Kit.sketch
- 2670 - v43.1 - Messenger Platform Design Kit v1.0.sketch
- 2655 - v71.2 - Wilhelm UI Kit.sketch
- 2635 - v48.2 - DesignCode-iOS11-GUI.sketch
- 2630 - v48.2 - DesignCode iOS 11 GUI.sketch
- 2507 - v48.2 - Angle Mockup Library
- 2446 - v71.2 - iOS 9.3 iPhone UI Kit.sketch
- 2376 - v69 - tradix.sketch
- 2362 - v79 - educo-online-learning-app-pixel-navy.sketch
- 2332 - v71.2 - iOS 8 UI Kit.sketch
- 2121 - v71.2 - Flightcard.sketch
- 2074 - v48.2 - holo-music-ui-kit-light.sketch
- 2058 - v48.2 - 1642662253.sketch
- 2057 - v48.2 - holo-music-ui-kit-dark.sketch
- 1972 - v61.2 - CoBank Free Version.sketch
- 1855 - v49.3 - Bottts Library.sketch
- 1774 - v46.2 - Facebook-Posts-Template.sketch
- 1775 - v46.2 - 1642662222.sketch
- 1656 - v71.2 - Windows10 UI Kit.sketch
- 1446 - v43.2 - building-blocks-framework-v1.sketch
- 1366 - v48.2 - FLOW-icons.sketch
- 1338 - v48.2 - Avatar Library.sketch
- 1099 - v47.1 - 1642664403.sketch
- 0999 - v48.2 - FLOW.sketch
- 0982 - v47.1 - UI Kit_buttons_1.0.sketch
- 0880 - v49.3 - FlowKit.sketch
- 0562 - v48.2 - wires-flowkit-donniesuazo.sketch
- 0140 - v83.1 - dynamic-arrows-arron-hunt.sketch

### figma 无法打开文件

- 2690 - v55.2 - 10 Error State Illustrations.sketch (无法打开)

## 效果测试

- 每个样张打开时间 first-painted,move-all,move-for-select,wheel-zoom
- 每个样张加载时间

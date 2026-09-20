# 主题配置

主题数据集中保存在 `presets/*.json`。Antdv 组件与后台布局共享最终主题的颜色；玻璃主题共用 `src/assets/styles/glass.css`。

## 文件职责

- `presets/`：默认浅色、默认深色、深墨玻璃的独立配置。
- `index.ts`：主题注册，以及设置抽屉中的浅色／深色风格选项。
- `resolve.ts`：算法名称转换、基础 Token 与覆盖值合并。组件配置按组件、按字段合并。
- `sync-css-vars.ts`：从最终 Antdv Token 同步后台颜色，并应用材质参数。切换时删除上一套主题独有的变量。
- `types.ts`：配置类型。
- `src/config/antd-theme.ts`：将现有模式、主题与主色设置接到解析入口。

## 增加内置主题

1. 根据模式复制 `presets/default-light.json`、`presets/default-dark.json` 或 `presets/midnight-glass.json`，修改唯一 `id`、`name` 和需要的数值。
2. 在 `index.ts` 导入 JSON 并加入 `themePresets`。
3. 浅色主题注册到 `lightThemePresets`，深色主题注册到 `darkThemePresets`，例如深色：

   ```ts
   forest: { preset: themePresets['forest-dark'], labelKey: '' },
   ```

设置抽屉会自动显示它，`LightThemeStyle` / `DarkThemeStyle` 类型与持久化校验同步扩展。`labelKey` 非空时使用现有 i18n 文案，空字符串时显示 JSON 的 `name`。现有 `default`、`glass` 注册键用于兼容已保存的设置，不要改名。

设置顶部的浅色／深色按钮直接切换当前模式，下拉框仅展示对应模式的风格。两种模式分别记住风格，刷新后恢复；系统模式下显示当前实际模式，点击按钮后改为手动选择。浅色目前有默认风格，深色有默认与夜航玻璃。尚不包含用户上传 JSON 的界面或运行时导入校验。

## JSON 字段

- `version`：当前为 `1`。
- `algorithm`：`light`、`dark`、`compact`，也可组合为 `["dark", "compact"]`。
- `token`：Antdv 全局 Token。
- `components`：Antdv 组件 Token，例如 `Button.defaultBg`、`Switch.handleBg`。
- `appearance.style`：`default` 或 `glass`，选择已经实现的共用材质。
- `appearance.blur` / `mobileBlur`：桌面／小屏模糊半径，单位为 px；小屏未填时继承桌面值。
- `appearance.surface`：玻璃面板背景。
- `appearance.variables`：布局与玻璃效果的 CSS 自定义属性。长度需要包含单位，可引用同步后的颜色，如 `var(--color-bg-layout)`。

普通配色和玻璃变体只需要 JSON 与注册项。新的材质需要先实现对应 CSS，并扩展解析器支持的 `style`。

## 覆盖与同步

Antdv 配置的顺序为：基础 Token → JSON → 调用方显式覆盖。现有主色选择器作为最后一层覆盖 `colorPrimary` 和 `colorLink`，保留原有行为。

后台的 `--color-bg-*`、`--color-text-*`、`--color-border-*`、主色与状态色来自 `getDesignToken` 的最终结果，不再由设置 Store 另算色阶。`variables.css` 只提供初始化默认值和公共布局变量；颜色会以 Antdv 算法的计算结果为准。

中性玻璃按钮的背景、文字和边框变量直接读取最终 `components.Button`，无需在 `appearance` 重复定义。场景、阴影、动画和透明混合比例由玻璃 JSON 配置。`appearance.variables` 在变量同步的最后应用，应优先用于材质与布局差异，避免重新定义公共 Token 颜色。

根节点的 `data-theme` 标识当前主题，`data-theme-style` 启用共用材质。仅在实际使用玻璃主题时启用玻璃 CSS；保存玻璃偏好后切换到浅色，不会残留该材质。

根 ConfigProvider 与静态弹窗等 API 复用同一份 Antdv 配置。移动端模糊、减少动态效果和不支持 backdrop-filter 时的可读背景仍由共用 CSS 处理。

页面区域由不参与 Tab 切换动画的 `.page-scroll` 统一执行背景模糊。其内部卡片、表格面板、输入框和按钮保留透明底色与高光，通过继承 `--glass-panel-backdrop: none` / `--glass-control-backdrop: none` 避免重复模糊。不要在这些子组件中重新硬编码 `backdrop-filter`，否则 KeepAlive 页面切换的透明度／位移动画可能引起局部重绘残留。弹出层保留独立的模糊，面板内控件不再叠加模糊。

## 玻璃组件覆盖与维护

以当前安装的 Antdv Next 1.5.4 为准，颜色和状态优先使用 `midnight-glass.json` 的组件 Token；`glass.css` 只补充材质、浮层边缘和必要的状态背景。不要在颜色 Token 中放入工具类名。组件算法可能解析颜色，因此颜色 Token 使用实际颜色，引用 CSS 变量的材质效果放在 `appearance.variables` 与 CSS 中。

| 类别                                                                                                                           | 适配方式                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Message、Notification、Tooltip、Tour、Alert                                                                                    | 浮层模糊、可读底色、可见边缘；提示和通知保留状态图标色，Alert 保留语义色          |
| Modal、Drawer、Popover / Popconfirm / ColorPicker、Dropdown                                                                    | 共用浮层材质，Popover / Tour 箭头与背景一致；Tooltip 自定义颜色仍由组件处理       |
| Input / TextArea / Password / Search / OTP、InputNumber、Mentions                                                              | 组件 Token 控制透明底色、悬停和激活底色，外层控件模糊；保留无边框、禁用与校验状态 |
| Select / AutoComplete / TreeSelect / Cascader、DatePicker / TimePicker                                                         | 输入部分与弹层分别适配，选项与日期范围跟随主色                                    |
| Button / FloatButton / BackTop、Switch、Radio、Checkbox、Segmented、Slider                                                     | 透明背景、边缘或内高光；禁用、焦点、选中及状态色仍由组件管理                      |
| Table、Card、Collapse、Descriptions、Calendar、Transfer、Tree、Listy                                                           | 面板材质及内部区域 Token；表格固定列使用不透明底色，普通与虚拟表格共用单元格规则  |
| Tabs、Pagination、Menu、Upload、Tag、Avatar、Image 预览工具栏                                                                  | 容器、选中态或表面高光；菜单危险项和上传错误状态保留语义色                        |
| Typography、Breadcrumb、Anchor、Form、Steps、Timeline、Progress、Rate、Badge、Spin、Skeleton、Empty、Result、Divider、Splitter | 继承全局 Token；文字、图标、状态标记和进度本身不额外叠加玻璃面板                  |
| Flex、Space、Grid、Affix、Masonry、Carousel、Watermark 等结构组件                                                              | 继承主题或内容样式，不强加背景；图片像素和 QRCode 不做透明化                      |

材质只在 `data-theme-style="glass"` 下启用。默认浅色／深色不加载这些覆盖。业务页面的内联 `style`、自定义 `styles` 或 `!important` 仍可能覆盖主题，需要在对应页面处理。升级组件库后应核对实际 DOM（如 Message 的 notice、Table 的 cell-fix），并复查浮层、静态 API、固定列、状态和主题切换，不能仅凭选择器清单判断视觉适配完成。

## [1.0.1](https://github.com/alx-plugins/better-fn/compare/1.0.0...1.0.1) (2021-06-09)


### Bug Fixes

* fix dblclick fail to open footnote when footnote not in active dom ([4931509](https://github.com/alx-plugins/better-fn/commit/4931509b57b5e8aa1dab5681ff1dfe2d8c68472b)), closes [#8](https://github.com/alx-plugins/better-fn/issues/8)

# [1.0.0](https://github.com/alx-plugins/better-fn/compare/0.3.0...1.0.0) (2021-06-08)


### Bug Fixes

* fix inline math equation not loaded in popover ([42b26ae](https://github.com/alx-plugins/better-fn/commit/42b26aee2993db318c3688786b6a99aea422cfa9))
* fix onUnloadFile not destroy tippy instance ([3397238](https://github.com/alx-plugins/better-fn/commit/33972384c0e2c453dbfa61e3b2309364d8315955))
* hover popover now always show on top of click popover ([51aad10](https://github.com/alx-plugins/better-fn/commit/51aad10119ec28b4f3a5417c39c89d1712df3a8d))
* popover not working with multiple label to the same reference ([ffe119d](https://github.com/alx-plugins/better-fn/commit/ffe119db8d1e64c8308ca093c5aaa12843e47825)), closes [#6](https://github.com/alx-plugins/better-fn/issues/6)
* remove mobile flag ([90ad42a](https://github.com/alx-plugins/better-fn/commit/90ad42a066b1162e4ded8974482e5d2f8a5ec637))


### Features

* **main.css:** add fade in/out animation for ref highlight ([ac10d3d](https://github.com/alx-plugins/better-fn/commit/ac10d3d3dbb432be70f2d7dc84d894bf596d0cc9))
* add option to show reference at buttom ([4905e17](https://github.com/alx-plugins/better-fn/commit/4905e1748fa59780a2d67a24f2e979dbac264575)), closes [#3](https://github.com/alx-plugins/better-fn/issues/3)
* double click on label to jump to reference ([7f0ddde](https://github.com/alx-plugins/better-fn/commit/7f0dddeced1b6d01ff05b2d54a9e2e5df624323b))
* **main.css:** font-size in popover now respect obsidian's setting ([b98f792](https://github.com/alx-plugins/better-fn/commit/b98f79214d4517fd4e4803ea1560361cb3866c53))
* improve keyboard accessibility ([90d9897](https://github.com/alx-plugins/better-fn/commit/90d98973360532b3726ba9828b26618908b4a63e))
* respect obsidian's color scheme ([9d56742](https://github.com/alx-plugins/better-fn/commit/9d56742c49f2a3113c33bbbace8e4a6ec2e2fd39)), closes [#4](https://github.com/alx-plugins/better-fn/issues/4)
* support smooth transition between popovers ([ce995cf](https://github.com/alx-plugins/better-fn/commit/ce995cf1fb9a12bc29405d7b20b6c37c58807a25))


### BREAKING CHANGES

* - PopoverRenderChild is deprecated, replaced by createPopover()

# [0.3.0](https://github.com/alx-plugins/better-fn/compare/0.2.2...0.3.0) (2021-05-26)


### Features

* **main.ts:** refresh opened previews when unload and load ([c91493f](https://github.com/alx-plugins/better-fn/commit/c91493f137470e1956c85b3d21d7d2ee97c8e8c3))

## [0.2.2](https://github.com/alx-plugins/better-fn/compare/0.2.1...0.2.2) (2021-05-25)


### Bug Fixes

* **main.css:** change footnote-ref color to default ([fe73deb](https://github.com/alx-plugins/better-fn/commit/fe73deb268ab3160a49676cc58e0a5035e3516cc))

## [0.2.1](https://github.com/alx-plugins/better-fn/compare/0.2.0...0.2.1) (2021-05-14)

# [0.2.0](https://github.com/alx-plugins/better-fn/compare/0.1.1...0.2.0) (2021-05-12)


### Features

* **main.css:** add max-height and scroll for popover content ([2ed8730](https://github.com/alx-plugins/better-fn/commit/2ed8730124037f350753ab597a79191159d2dfca))
* **main.css:** add min width for internal note embed in popover ([308b67d](https://github.com/alx-plugins/better-fn/commit/308b67dfabbe5c443c3c623d98994e9a3fd64a6b))

## [0.1.1](https://github.com/alx-plugins/better-fn/compare/0.1.0...0.1.1) (2021-05-12)


### Bug Fixes

* popover now work with internal note embeds ([59810c6](https://github.com/alx-plugins/better-fn/commit/59810c6f59438e84aa9cbc9ca7cd4e275b18f8df))

# 0.1.0 (2021-05-11)


### Bug Fixes

* fix duplicate div.popper-container ([612ddd3](https://github.com/alx-plugins/better-fn/commit/612ddd30d77f34dcc5f052ff7eed8b80a48acc78))
* fix footnote popover not working with reference style footnote ([35e345f](https://github.com/alx-plugins/better-fn/commit/35e345f6a9046a616097b6148121aafc8c95a20b))
* popover now works with internal embeds ([09e7712](https://github.com/alx-plugins/better-fn/commit/09e771242d5693ce370ce615e74cd3bfb659850f))


### Features

* add initial support for footnote popover ([4991573](https://github.com/alx-plugins/better-fn/commit/4991573edb6d00f6742cbb08418686bfbb8c6094))
* add method to remove redundant element from fnInfo ([8030c1b](https://github.com/alx-plugins/better-fn/commit/8030c1bed5930b938454c3b9eed8da3fc1a4726f))
* add styling to popover ([6240826](https://github.com/alx-plugins/better-fn/commit/6240826123e826a5f31dbb96c3bae5a3b1695708))
* add tippy animation ([149ed6a](https://github.com/alx-plugins/better-fn/commit/149ed6a03c2662d1762b5129dfee9c39310e8877))
* change cursor style when hovering on <sup> ([ca98387](https://github.com/alx-plugins/better-fn/commit/ca98387d97a61145e7366a4d68462a67bc150ca4))
* introduce tippy.js ([ba9e697](https://github.com/alx-plugins/better-fn/commit/ba9e69793b7601a19ba7565e1a48041c1ea5095d))


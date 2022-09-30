# next-manifest-loader [![npm version](https://badgen.net/npm/v/next-manifest-loader)](https://www.npmjs.com/package/next-manifest-loader) [![license](https://badgen.net/github/license/tomsseisums/next-manifest-loader)](https://github.com/tomsseisums/next-manifest-loader/blob/master/LICENSE) [![downloads](https://badgen.net/npm/dt/next-manifest-loader)](https://www.npmjs.com/package/next-manifest-loader)

Features:

- **Favicon & manifest generator** Using the [`favicons`](https://github.com/itgalaxy/favicons) package generates favicons and manifests for all required platforms
- **Single JSON formatted file input** Generates everything off a single `favicons` config (as JSON) file import
- **Webpack loader** Simple installation as Next.js plugin automatically installs a dedicated webpack loader for the manifest
- **Generates HTML helmet data** Returns the HTML header links for all generated icons and manifest info
- **React generator** The HTML header links are already React elements ready for you to insert using [`react-helmet`](https://github.com/nfl/react-helmet) or `next/head`

## Table of contents

- [Installation](#installation)
- [Options](#loader-options)
- [Usage](#usage)
- [License](#license)

## Installation

```bash
npm install --save-dev next-manifest-loader
# or
yarn add -D next-manifest-loader
```

```javascript
// next.config.js

const { withManifest } = require('next-manifest-loader')(/* loader options can come here */)

const nextConfig = {
  /* your Next.js config */
}

module.exports = withManifest(nextConfig)
```

## Loader Options

You can adjust these options:
| Option | Type | Default | Description |
| :--- | :--: | :-- | :---------- |
| `outputPath` | string | `static/manifest` | Where to put the generated files. |
| `forceEmit` | boolean | `false` | Development mode by default only emits single image and link tag, enable this to run the full `favicons` generation suite. |
| `test` | RegExp | `/\.manifest$/` | Allow overriding `test` clause to use for webpack loader. If using TypeScript, by overriding this, you also need to provide your own `declare module "*.<ext>";` type. |

## Usage

You can now simply create a single svg<sup>1</sup> file of your favicon, add path to it in your `app.manifest` file using `sourceImage` key (relative to manifest file), require the manifest file in `_app.js` in your Next.js app, and in Dev mode a simple favicon will be set (with updating hashname so you can see the updates on refresh) and in production builds a full set of icons and browser manifest will be generated and the associated HTML react components returned.

<sup>1: Not limited to `svg`, can also make a `png`, but make sure it's bigger than 512x512.</sup>

### Example

Create an `app.manifest` file specifying properties for `favicons` config, additionally specifying `sourceImage` where the loader should look for the single image file to generate all icons for all platforms and sizes.

```jsonc
// app.manifest

{
  // Specify from which image to generate all icons (relative to imported file)
  "sourceImage": "./app-icon.svg",
  // Any config option as supported by `favicons` package
  "appName": "Novela by Narative",
  "appShortName": "Novela",
  "background": "#fff",
  "theme_color": "#fff",
  "display": "standalone"
}
```

_Assuming the `app.manifest` example above is put in your apps root._

```js
// pages/_app.tsx

import type { AppProps } from 'next/app'
import Head from 'next/head'
import Manifest from '../app.manifest' // <-- load the manifest config

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {Manifest} <!-- add assembled link and meta tags to <head /> -->
      </Head>
      <Component {...pageProps} />
    </>
  )
}
```

If using TypeScript, import module type in a `d.ts` file (so TS doesn't scream when you import `app.manifest`) or provide your own declaration in case you overrode `test` regex for loader options.

Make sure to add the `d.ts` file to `include` section of `tsconfig.json` as well.

```d.ts
// types.d.ts

/// <reference types="next-manifest-loader/module" />

// or

declare module '*.manifest' {
  import React from 'react'
  const Meta: React.ReactElement[]
  export default Meta
}
```

## TODO

- [ ] Try to make it work with `_document`
- [ ] Handle all the TODO comments in code
- [ ] Clean up repository from unncessary stuff
- [ ] CI/CD

## License

Licensed under the [MIT](https://github.com/tomsseisums/next-manifest-loader/blob/master/LICENSE) license.

© Heavily based on [`next-favicon-loader`](https://github.com/tinialabs/next-favicon-loader) by Guy Barnard and Tinia Labs contributors

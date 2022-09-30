import { resolve, relative, dirname, join } from 'path'
import { readFile } from 'fs/promises'
import type * as webpack from 'webpack'
import favicons, { FaviconOptions } from 'favicons'
import { interpolateName } from 'loader-utils'
import * as Log from 'next/dist/build/output/log'
import { normalizePath } from './utils'

const HTML_REGEX = new RegExp(/<([^ ]*)\s(.*)>/)

export interface LoaderOptions {
  /** Path where to put the generated files. */
  outputPath?: string
  /** Development mode by default only emits single image and link tag, enable this to run the full `favicons` generation suite. */
  forceEmit?: boolean
}

export type ManifestOptions = FaviconOptions & {
  sourceImage: string
}

const defaultOptions: LoaderOptions = {
  outputPath: 'static/manifest'
}

// TODO: Try to get rid of `normalizePath`.
export default async function loader(
  this: webpack.LoaderContext<LoaderOptions>,
  content: string
) {
  const callback = this.async()
  const options = Object.assign(
    {},
    defaultOptions,
    this.getOptions({
      type: 'object',
      properties: {
        outputPath: { type: 'string' },
        forceEmit: { type: 'boolean' }
      },
      additionalProperties: false
    })
  )

  try {
    await (async () => {
      // Load manifest settings.
      const { sourceImage: sourceImagePath, ...config } = JSON.parse(
        content
      ) as ManifestOptions

      const configHashUrl = interpolateName(this, '[name].[hash].[ext]', {
        context: this.rootContext,
        content
      })

      // Check for presence of image path.
      if (!sourceImagePath) throw new Error('sourceImage is not defined')

      // Next'ify output path.
      config.path = `/_next/${options.outputPath}`

      // Resolve source image (relative to manifest file).
      const fullSourceImagePath = resolve(
        dirname(this.resourcePath),
        sourceImagePath
      )

      this.addDependency(fullSourceImagePath)
      const sourceImage = await readFile(fullSourceImagePath)

      // Override resource path, using the image as the core resource.
      // This will generate names based on the image path instead of loaded manifest path.
      this.resourcePath = fullSourceImagePath

      const imageHashUrl = interpolateName(this, '[name].[hash].[ext]', {
        context: this.rootContext,
        content: sourceImage
      })

      const isFull = process.env.NODE_ENV === 'production' || options.forceEmit

      let tags: string[]

      if (!isFull) {
        const sourceFilename = normalizePath(
          relative(this.rootContext, this.resourcePath)
        )

        const emitLocation = join(options.outputPath, imageHashUrl)

        this.emitFile(emitLocation, sourceImage, null, {
          isImmutable: true,
          sourceFilename
        })

        tags = [`<link rel="icon" href="${config.path}/${imageHashUrl}">`]
      } else {
        Log.warn(
          'Generating a new set of favicons, this will take some time...'
        )
        // Generate icons
        const { html, images, files } = await favicons(sourceImage, config)
        tags = html

        const assets = images.map(({ name, contents }) => ({
          name: join(options.outputPath, name),
          contents: contents
        }))

        assets.forEach(({ name, contents }) => {
          const assetInfo: any = {}

          let normalizedName = name

          const idx = normalizedName.indexOf('?')

          if (idx >= 0) {
            normalizedName = normalizedName.substr(0, idx)
          }

          const isImmutable =
            /\[([^:\]]+:)?(hash|contenthash)(:[^\]]+)?]/gi.test(normalizedName)

          if (isImmutable === true) {
            assetInfo.immutable = true
          }

          assetInfo.sourceFilename = normalizePath(
            relative(this.rootContext, this.resourcePath)
          )

          this.emitFile(name, contents, null, assetInfo)
        })

        files.forEach(({ name, contents }) => {
          const emitLocation = join(options.outputPath, name)
          this.emitFile(emitLocation, contents, null)
        })
      }

      const elements = tags
        .map((tag, i) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, tagName, rest] = HTML_REGEX.exec(tag)
          const items = rest
            .split('" ')
            .map((x) => x.split('='))
            .map(([key, value]) => [
              key,
              value.replace(/^"/, '').replace(/"$/, '')
            ])
            .concat([['key', `${i}`]])

          const attributes = Object.fromEntries(items)

          return `React.createElement("${tagName}", ${JSON.stringify(
            attributes
          )})`
        })
        .join(',')

      const result = `import * as React from 'react'; export default [${elements}]`

      // Return generated source.
      callback(null, result)
    })()
  } catch (ex) {
    console.error(ex)
  }
}

module.exports.raw = true

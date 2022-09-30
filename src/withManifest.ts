import path from 'path'
import type { NextConfig } from 'next'
import { LoaderOptions } from './loader'

type PluginOptions = LoaderOptions & {
  /**
   * Allow overriding `test` clause to use for webpack loader. Defaults to `/\.manifest$/`
   *
   * If you override this, then you also need to provide your own `declare module "*.<ext>";` type (if using TypeScript).
   * */
  test?: RegExp
}

/**
 * This is a Next.js plugin that resolvs a single manifest import to generate all (fav)icons and manifest files
 * needed for a modern web app across multiple platforms.
 */
export = ({ test = /\.manifest$/, ...loaderOptions }: PluginOptions = {}) =>
  (nextConfig?: NextConfig): NextConfig => {
    const userWebpack = nextConfig.webpack ?? ((x) => x)

    return {
      ...nextConfig,
      webpack: (config, ...rest) => {
        config.module.rules.push({
          test,
          use: [
            {
              loader: path.resolve(__dirname, './loader.js'),
              options: loaderOptions
            }
          ]
        })

        return userWebpack(config, ...rest)
      }
    }
  }

import { writeFileSync, existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'
import prompts from 'prompts'

const authPath = resolve(__dirname, '../../.auth.json')

if (!existsSync(authPath)) {
  writeFileSync(authPath, JSON.stringify({}))
}

const authData: AuthData = require('../../.auth.json')

interface AuthData {
  soulma: {
    token: string
  }
  mastergo: {
    account: {
      name: string
      password: string
    }
  }
  xiaopiu: {
    cookie: string
  }
  figma: {
    account: {
      name: string
      password: string
    }
  }
  pixso: {
    account: {
      name: string
      password: string
    }
  }
  [key: string]: any
}

export const authStorage = {
  get(product?: string) {
    if (typeof product === 'string') {
      return authData[product]
    }

    return authData
  },

  setAuthData(key: string, value: any) {
    authData[key] = value
  },

  updateAuthDataWith(product: string, key: string, value: any) {
    authData[product][key] = value
  },

  write() {
    return writeFile(authPath, JSON.stringify(authData, null, 2), {
      encoding: 'utf-8',
    })
  },
}

export const authConfirmer = {
  async askForSoulma(): Promise<string> {
    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: `Input token for soulma(check "XK-Token" in localStorage):`,
    })

    return value
  },

  async askForMastergo(): Promise<{ name: string; password: string }> {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: `Input username for mastergo:`,
    })

    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Input password for mastergo:',
    })

    return {
      name,
      password,
    }
  },

  async askForXiaopiu(): Promise<string> {
    const { value } = await prompts({
      type: 'text',
      name: 'value',
      message: `Input cookie for xiaopiu(check "xiaopiuDesignSess" in cookie):`,
    })

    return value
  },

  async askForFigma(): Promise<{ name: string; password: string }> {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Input account for figma:',
    })
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Input password for figma:',
    })

    return {
      name,
      password,
    }
  },

  async askForPixso(): Promise<{ name: string; password: string }> {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Input mobile for pixso:',
    })
    const { password } = await prompts({
      type: 'password',
      name: 'password',
      message: 'Input password for pixso:',
    })

    return {
      name,
      password,
    }
  },
}

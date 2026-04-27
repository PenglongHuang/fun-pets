import Store from 'electron-store'
import { storeDefaults, type StoreSchema } from '../shared/store-schema'

let _store: Store<StoreSchema> | null = null

export function getStore(): Store<StoreSchema> {
  if (!_store) {
    _store = new Store<StoreSchema>({
      defaults: storeDefaults,
    })
  }
  return _store
}

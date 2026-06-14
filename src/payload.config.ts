import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Customers} from './collections/Customers'
import { Omplassering } from './collections/Omplassering'
import { Breeds } from './collections/Breeds'
import { PetTypes } from './collections/PetType'
import { Dyremat } from './collections/Dyremat'
import { MatTypes } from './collections/MatTypes'
import { TilbehorTypes } from './collections/TilbehorType'
import { Tilbehor } from './collections/Tilbehor'
import { DeliveryCompanies } from './collections/Deliverycompanies'
import { Stores } from './collections/Stores'
import { Pets } from './collections/Pets'
import { Orders } from './collections/Orders'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Customers, Omplassering, PetTypes, Breeds, Dyremat, MatTypes, TilbehorTypes, Tilbehor, DeliveryCompanies, Stores, Pets, Orders],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
    // THAY ĐỔI TẠI ĐÂY: Ép Payload v3 tự động vẽ cấu trúc bảng vào file SQLite khi Server khởi động
    push: true, 
  }),
  sharp,
  plugins: [],
})

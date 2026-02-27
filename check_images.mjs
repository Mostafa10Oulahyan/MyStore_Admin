import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
    'https://btiuxycmfbaeqrnfhgjl.supabase.co',
    'sb_publishable_CbXv9CxFiX2PnCZSXmtfHw_CjnBSLu9'
)

let log = ''
const l = (msg) => { log += msg + '\n'; console.log(msg) }

const { data: products } = await supabase.from('products').select('id, name').limit(5)
l('PRODUCTS: ' + JSON.stringify(products?.map(p => p.name)))

const { data: imgs } = await supabase.from('product_images').select('product_id, image_url').limit(5)
l('IMAGES_COUNT: ' + (imgs?.length || 0))
if (imgs?.length > 0) l('FIRST_URL: ' + imgs[0].image_url)

const testContent = new Uint8Array([137, 80, 78, 71])
const { error: upErr } = await supabase.storage.from('product-images').upload('_test/t.png', testContent)
l('UPLOAD_ERR: ' + (upErr?.message || 'NONE'))

if (products?.length > 0) {
    const { error: insErr } = await supabase.from('product_images').insert({
        product_id: products[0].id, image_url: 'https://test.com/t.jpg', is_primary: false, display_order: 99
    })
    l('INSERT_ERR: ' + (insErr?.message || 'NONE'))
    // cleanup
    await supabase.from('product_images').delete().eq('display_order', 99)
}

writeFileSync('debug_output.txt', log)
l('DONE')

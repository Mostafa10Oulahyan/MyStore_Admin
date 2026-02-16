-- ============================================================================
-- 1. USERS TABLE (Synced from Clerk)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id text PRIMARY KEY, -- Clerk user ID
  email character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  phone_number character varying,
  profile_image_url text, -- From Clerk
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid()::text = id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid()::text = id);
    END IF;
END
$$;

-- ============================================================================
-- 2. ADDRESSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label character varying,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  street_address text NOT NULL,
  city character varying NOT NULL,
  quartier character varying,
  phone_number character varying NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own addresses' AND tablename = 'addresses') THEN
        CREATE POLICY "Users can view their own addresses" ON public.addresses FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can insert their own addresses' AND tablename = 'addresses') THEN
        CREATE POLICY "Users can insert their own addresses" ON public.addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own addresses' AND tablename = 'addresses') THEN
        CREATE POLICY "Users can update their own addresses" ON public.addresses FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can delete their own addresses' AND tablename = 'addresses') THEN
        CREATE POLICY "Users can delete their own addresses" ON public.addresses FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END
$$;

-- ============================================================================
-- 3. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  image_url text, -- Can be from product-images bucket or external
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view active categories' AND tablename = 'categories') THEN
        CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage categories' AND tablename = 'categories') THEN
        CREATE POLICY "Service role can manage categories" ON public.categories FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 4. PRODUCT TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view product types' AND tablename = 'product_types') THEN
        CREATE POLICY "Anyone can view product types" ON public.product_types FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage product types' AND tablename = 'product_types') THEN
        CREATE POLICY "Service role can manage product types" ON public.product_types FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 5. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  product_type_id uuid NOT NULL REFERENCES public.product_types(id),
  base_price numeric NOT NULL,
  compare_at_price numeric,
  sku character varying UNIQUE,
  status character varying DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  featured boolean DEFAULT false,
  average_rating numeric DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  review_count integer DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view active products' AND tablename = 'products') THEN
        CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (status = 'active' OR auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage products' AND tablename = 'products') THEN
        CREATE POLICY "Service role can manage products" ON public.products FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 6. PRODUCT VARIANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color character varying NOT NULL,
  color_hex character varying,
  size character varying NOT NULL,
  sku character varying UNIQUE,
  price numeric,
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view available variants' AND tablename = 'product_variants') THEN
        CREATE POLICY "Anyone can view available variants" ON public.product_variants FOR SELECT USING (is_available = true OR auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage variants' AND tablename = 'product_variants') THEN
        CREATE POLICY "Service role can manage variants" ON public.product_variants FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 7. PRODUCT IMAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text character varying,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view product images' AND tablename = 'product_images') THEN
        CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage product images' AND tablename = 'product_images') THEN
        CREATE POLICY "Service role can manage product images" ON public.product_images FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 8. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number character varying NOT NULL UNIQUE,
  user_id text REFERENCES public.users(id),
  delivery_address_id uuid REFERENCES public.addresses(id), -- Linked address for registered users
  -- Customer details are snapshot here (required for Guests, optional if delivery_address_id is used but good to have as snapshot)
  customer_first_name character varying, 
  customer_last_name character varying,
  customer_email character varying,
  customer_phone character varying NOT NULL,
  customer_address text,
  customer_city character varying,
  status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'delivered', 'cancelled')),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  shipping_cost numeric DEFAULT 0 CHECK (shipping_cost >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_method character varying DEFAULT 'cod',
  notes text,
  admin_notes text,
  estimated_delivery_date timestamp with time zone,
  confirmed_at timestamp with time zone,
  delivered_at timestamp with time zone,
  rejected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own orders' AND tablename = 'orders') THEN
        CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid()::text = user_id OR auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Authenticated users can create orders' AND tablename = 'orders') THEN
        CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL OR auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can update orders' AND tablename = 'orders') THEN
        CREATE POLICY "Service role can update orders" ON public.orders FOR UPDATE USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 9. ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  product_name character varying NOT NULL,
  product_image_url text,
  color character varying NOT NULL,
  size character varying NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view items from their orders' AND tablename = 'order_items') THEN
        CREATE POLICY "Users can view items from their orders" ON public.order_items FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = order_items.order_id
                AND (orders.user_id = auth.uid()::text OR auth.role() = 'service_role')
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage order items' AND tablename = 'order_items') THEN
        CREATE POLICY "Service role can manage order items" ON public.order_items FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 10. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified_purchase boolean DEFAULT true,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id, order_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Anyone can view approved reviews' AND tablename = 'reviews') THEN
        CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true OR auth.uid()::text = user_id OR auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can create reviews for delivered orders' AND tablename = 'reviews') THEN
        CREATE POLICY "Users can create reviews for delivered orders" ON public.reviews FOR INSERT WITH CHECK (
            auth.uid()::text = user_id AND
            EXISTS (
                SELECT 1 FROM public.orders
                WHERE orders.id = reviews.order_id
                AND orders.user_id = auth.uid()::text
                AND orders.status = 'delivered'
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own pending reviews' AND tablename = 'reviews') THEN
        CREATE POLICY "Users can update their own pending reviews" ON public.reviews FOR UPDATE USING (auth.uid()::text = user_id AND is_approved = false) WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can manage all reviews' AND tablename = 'reviews') THEN
        CREATE POLICY "Service role can manage all reviews" ON public.reviews FOR ALL USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- ============================================================================
-- 11. CART ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id),
  color character varying NOT NULL,
  size character varying NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id, variant_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own cart' AND tablename = 'cart_items') THEN
        CREATE POLICY "Users can view their own cart" ON public.cart_items FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can manage their own cart' AND tablename = 'cart_items') THEN
        CREATE POLICY "Users can manage their own cart" ON public.cart_items FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can update their own cart' AND tablename = 'cart_items') THEN
        CREATE POLICY "Users can update their own cart" ON public.cart_items FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can delete from their own cart' AND tablename = 'cart_items') THEN
        CREATE POLICY "Users can delete from their own cart" ON public.cart_items FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END
$$;

-- ============================================================================
-- 12. FAVORITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can view their own favorites' AND tablename = 'favorites') THEN
        CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can add to favorites' AND tablename = 'favorites') THEN
        CREATE POLICY "Users can add to favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Users can remove from favorites' AND tablename = 'favorites') THEN
        CREATE POLICY "Users can remove from favorites" ON public.favorites FOR DELETE USING (auth.uid()::text = user_id);
    END IF;
END
$$;

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
-- Only product-images bucket as requested
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES (Using product-images bucket)
DO $$
BEGIN
    -- Public access
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Public product image access' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Public product image access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
    END IF;

    -- Service role access
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can upload product images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Service role can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can update product images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Service role can update product images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'service_role');
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE policyname = 'Service role can delete product images' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Service role can delete product images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'service_role');
    END IF;
END
$$;
-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert categories
INSERT INTO public.categories (name, slug, description, is_active, display_order) VALUES
('Men', 'men', 'Clothing for men', true, 1),
('Women', 'women', 'Clothing for women', true, 2),
('Kids', 'kids', 'Clothing for children', true, 3),
('Accessories', 'accessories', 'Fashion accessories', true, 4);

-- Insert product types
INSERT INTO public.product_types (name, slug, description) VALUES
('T-Shirt', 't-shirt', 'Short sleeve shirts'),
('Pants', 'pants', 'Trousers and jeans'),
('Dress', 'dress', 'Dresses'),
('Shoes', 'shoes', 'Footwear'),
('Bag', 'bag', 'Bags and backpacks');

-- Insert sample products (you'll need actual category and type IDs)
INSERT INTO public.products (name, slug, description, category_id, product_type_id, base_price, compare_at_price, sku, status, featured)
SELECT 
  'Classic White T-Shirt',
  'classic-white-tshirt',
  'Comfortable cotton t-shirt in classic white',
  (SELECT id FROM public.categories WHERE slug = 'men' LIMIT 1),
  (SELECT id FROM public.product_types WHERE slug = 't-shirt' LIMIT 1),
  299.00,
  399.00,
  'TSH-WHT-001',
  'active',
  true;

INSERT INTO public.products (name, slug, description, category_id, product_type_id, base_price, compare_at_price, sku, status, featured)
SELECT 
  'Blue Denim Jeans',
  'blue-denim-jeans',
  'Stylish blue denim jeans for everyday wear',
  (SELECT id FROM public.categories WHERE slug = 'men' LIMIT 1),
  (SELECT id FROM public.product_types WHERE slug = 'pants' LIMIT 1),
  799.00,
  999.00,
  'JNS-BLU-001',
  'active',
  true;

-- Insert product variants
INSERT INTO public.product_variants (product_id, color, color_hex, size, sku, price, stock_quantity, is_available)
SELECT 
  id,
  'White',
  '#FFFFFF',
  'M',
  'TSH-WHT-001-M',
  299.00,
  50,
  true
FROM public.products WHERE sku = 'TSH-WHT-001';

INSERT INTO public.product_variants (product_id, color, color_hex, size, sku, price, stock_quantity, is_available)
SELECT 
  id,
  'White',
  '#FFFFFF',
  'L',
  'TSH-WHT-001-L',
  299.00,
  30,
  true
FROM public.products WHERE sku = 'TSH-WHT-001';

INSERT INTO public.product_variants (product_id, color, color_hex, size, sku, price, stock_quantity, is_available)
SELECT 
  id,
  'Blue',
  '#1E40AF',
  '32',
  'JNS-BLU-001-32',
  799.00,
  25,
  true
FROM public.products WHERE sku = 'JNS-BLU-001';
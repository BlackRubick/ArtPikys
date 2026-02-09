import { useCallback, useEffect, useMemo, useState } from 'react'
import { db } from './firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore'
import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import {
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from 'react-router-dom'

type Product = {
  id: string
  name: string
  price: number
  image: string
  images: string[]
  description: string
  materials: string[]
  story: string
  category: string
  isNew?: boolean
  limited?: boolean
  featured?: boolean
}

type ProductForm = Omit<Product, 'id'>

type BlogPost = {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
}

const ADMIN_USER = 'AdministradorPikis'
const ADMIN_PASS = 'Pikis2026**'
const STORAGE_KEY = 'pikis_products'
const AUTH_KEY = 'pikis_admin'
const WHATSAPP_NUMBER = '529611228702'
const FACEBOOK_URL = 'https://www.facebook.com/p/Artesan%C3%ADas-Pikys-100054419910160/'
const MAPS_URL = 'https://maps.app.goo.gl/7nUUh5nsvLvMzfsk7'
const buildWhatsappLink = (name: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hola, estoy interesado en el producto: ${name}`
  )}`
const buildWhatsappChatLink = () => `https://wa.me/${WHATSAPP_NUMBER}`


const blogPosts: BlogPost[] = [
  {
    id: 'b1',
    title: 'Cómo reciclar textiles en casa',
    excerpt: 'Ideas simples para dar nueva vida a telas y prendas.',
    content:
      'Separar por tipo de tela, reutilizar retazos para bolsas, tapetes o envoltorios. Lava con jabones biodegradables y evita mezclas sintéticas para facilitar el reciclaje.',
    image:
      'https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'b2',
    title: 'Proceso creativo: del residuo a la pieza',
    excerpt: 'Nuestro paso a paso para transformar materiales.',
    content:
      'Seleccionamos materiales recuperados, los preparamos y combinamos con técnicas artesanales. Cada etapa busca reducir residuos y preservar la calidad final.',
    image:
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'b3',
    title: 'Historia de un producto icónico',
    excerpt: 'La evolución del canasto Pikis en 4 generaciones.',
    content:
      'Desde fibras recuperadas hasta acabados naturales, el canasto Pikis representa tradición y reinvención. Cada generación aporta nuevas técnicas sin perder la esencia.',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80'
  }
]

const emptyForm: ProductForm = {
  name: '',
  price: 0,
  image: '',
  images: [],
  description: '',
  materials: [],
  story: '',
  category: '',
  isNew: false,
  limited: false,
  featured: false
}

type EditProductPageProps = {
  isAuthed: boolean
  loginUser: string
  setLoginUser: React.Dispatch<React.SetStateAction<string>>
  loginPass: string
  setLoginPass: React.Dispatch<React.SetStateAction<string>>
  loginError: string
  handleLogin: (event: React.FormEvent) => void
  resetForm: () => void
  products: Product[]
  form: ProductForm
  materialsText: string
  setMaterialsText: React.Dispatch<React.SetStateAction<string>>
  handleFormChange: <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => void
  handleSubmit: (event: React.FormEvent) => void
  handleMainImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleGalleryUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleEdit: (product: Product) => void
}

function EditProductPage({
  isAuthed,
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  loginError,
  handleLogin,
  resetForm,
  products,
  form,
  materialsText,
  setMaterialsText,
  handleFormChange,
  handleSubmit,
  handleMainImageUpload,
  handleGalleryUpload,
  handleEdit
}: EditProductPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = id ? products.find((item) => item.id === id) : undefined

  useEffect(() => {
    if (product) {
      handleEdit(product)
    } else if (!id) {
      resetForm()
    }
  }, [product, id, handleEdit, resetForm])

  if (!isAuthed) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mx-auto max-w-md animate-fade-up rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900">Acceso administrador</h2>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa tus credenciales para gestionar el catálogo.
          </p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <input
              value={loginUser}
              onChange={(event) => setLoginUser(event.target.value)}
              placeholder="Usuario"
              className="w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <input
              type="password"
              value={loginPass}
              onChange={(event) => setLoginPass(event.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2F5D50] px-4 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
            >
              Ingresar
            </button>
          </form>
        </div>
      </main>
    )
  }

  if (id && !product) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900">Producto no encontrado</h2>
          <p className="mt-2 text-sm text-slate-600">
            El producto que intentas editar no existe.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-6 rounded-full bg-[#2F5D50] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
          >
            Volver al panel
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">
            {id ? 'Editar producto' : 'Crear producto'}
          </h2>
          <p className="text-sm text-slate-600">
            {id ? 'Actualiza los datos y previsualiza.' : 'Completa los datos y previsualiza.'}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            navigate('/admin')
          }}
          className="rounded-full border border-[#E8D8C3] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:border-[#7A9E7E]"
        >
          Volver al panel
        </button>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-xl min-w-0 overflow-hidden">
          <form
            onSubmit={(event) => {
              handleSubmit(event)
              navigate('/admin')
            }}
            className="space-y-4 min-w-0"
          >
            <input
              value={form.name}
              onChange={(event) => handleFormChange('name', event.target.value)}
              placeholder="Nombre"
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => handleFormChange('price', Number(event.target.value))}
              placeholder="Precio"
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                Imagen principal
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMainImageUpload}
                className="block w-full max-w-full rounded-xl border border-[#E8D8C3] bg-white px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
              />
            </div>
            <input
              value={form.category}
              onChange={(event) => handleFormChange('category', event.target.value)}
              placeholder="Categoría"
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <textarea
              value={form.description}
              onChange={(event) => handleFormChange('description', event.target.value)}
              placeholder="Descripción"
              rows={4}
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <input
              value={materialsText}
              onChange={(event) => setMaterialsText(event.target.value)}
              placeholder="Materiales (separados por coma)"
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <textarea
              value={form.story}
              onChange={(event) => handleFormChange('story', event.target.value)}
              placeholder="Historia del producto"
              rows={3}
              className="w-full max-w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
            />
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                Galería de imágenes
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="block w-full max-w-full rounded-xl border border-[#E8D8C3] bg-white px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isNew}
                  onChange={(event) => handleFormChange('isNew', event.target.checked)}
                  className="h-4 w-4 rounded border-[#7A9E7E] text-[#2F5D50] focus:ring-[#7A9E7E]"
                />
                Nuevo
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.limited}
                  onChange={(event) => handleFormChange('limited', event.target.checked)}
                  className="h-4 w-4 rounded border-[#7A9E7E] text-[#2F5D50] focus:ring-[#7A9E7E]"
                />
                Edición limitada
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) => handleFormChange('featured', event.target.checked)}
                  className="h-4 w-4 rounded border-[#7A9E7E] text-[#2F5D50] focus:ring-[#7A9E7E]"
                />
                Destacado
              </label>
            </div>
            {form.image && (
              <img
                src={form.image}
                alt="Vista previa"
                className="h-40 w-full rounded-2xl object-cover"
              />
            )}
            {form.images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {form.images.slice(0, 6).map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={image}
                    alt={`Galería ${index + 1}`}
                    className="h-20 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#2F5D50] px-4 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
              >
                {id ? 'Guardar cambios' : 'Agregar producto'}
              </button>
              <button
                type="button"
                onClick={() => resetForm()}
                className="flex-1 rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm font-semibold text-[#2F5D50] hover:border-[#7A9E7E]"
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-3xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-900">Vista previa</h3>
          <div className="mt-4 rounded-3xl bg-[#F5F1EA] p-4">
            {form.image && (
              <img
                src={form.image}
                alt={form.name}
                className="h-48 w-full rounded-2xl object-cover"
              />
            )}
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-slate-900">
                {form.name || 'Nombre del producto'}
              </h4>
              <p className="mt-1 text-sm text-slate-600">
                {form.description || 'Descripción del producto'}
              </p>
              {materialsText.trim() && (
                <p className="mt-2 text-xs text-slate-500">
                  {materialsText}
                </p>
              )}
              <p className="mt-3 text-lg font-semibold text-[#2F5D50]">
                ${form.price ? form.price.toFixed(2) : '0.00'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.isNew && (
                  <span className="rounded-full bg-[#7A9E7E] px-3 py-1 text-xs font-semibold text-white">
                    Nuevo
                  </span>
                )}
                {form.limited && (
                  <span className="rounded-full bg-[#8B5E3C] px-3 py-1 text-xs font-semibold text-white">
                    Edición limitada
                  </span>
                )}
                {form.featured && (
                  <span className="rounded-full bg-[#2F5D50] px-3 py-1 text-xs font-semibold text-white">
                    Destacado
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [materialFilter, setMaterialFilter] = useState('Todos')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [materialsText, setMaterialsText] = useState('')
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/catalogo', label: 'Catálogo' },
    { to: '/sobre', label: 'Sobre' },
    { to: '/impacto', label: 'Impacto' },
    { to: '/faq', label: 'FAQ' },
    { to: '/blog', label: 'Blog' },
    { to: '/admin', label: 'Administrador' }
  ]


  // Escuchar productos en tiempo real desde Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot: QuerySnapshot<DocumentData>) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc: DocumentData) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      console.log('Productos actualizados en tiempo real:', productsData);
    });
    const auth = localStorage.getItem(AUTH_KEY)
    setIsAuthed(auth === 'true');
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (products.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    }
  }, [products])

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((item) => item.category)))
    return ['Todos', ...unique]
  }, [products])

  const materials = useMemo(() => {
    const unique = Array.from(
      new Set(products.flatMap((item) => item.materials ?? []))
    )
    return ['Todos', ...unique]
  }, [products])

  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null
    const max = priceMax ? Number(priceMax) : null

    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory =
        categoryFilter === 'Todos' || product.category === categoryFilter
      const matchesMaterial =
        materialFilter === 'Todos' || (product.materials ?? []).includes(materialFilter)
      const matchesNew = !onlyNew || product.isNew
      const matchesMin = min === null || product.price >= min
      const matchesMax = max === null || product.price <= max

      return (
        matchesQuery &&
        matchesCategory &&
        matchesMaterial &&
        matchesNew &&
        matchesMin &&
        matchesMax
      )
    })
  }, [products, query, categoryFilter, materialFilter, priceMin, priceMax, onlyNew])

  const featured = useMemo(
    () => products.filter((product) => product.featured).slice(0, 3),
    [products]
  )

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault()
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setIsAuthed(true)
      localStorage.setItem(AUTH_KEY, 'true')
      setLoginError('')
      setLoginUser('')
      setLoginPass('')
    } else {
      setLoginError('Credenciales inválidas. Intenta nuevamente.')
    }
  }

  const handleLogout = () => {
    setIsAuthed(false)
    localStorage.removeItem(AUTH_KEY)
  }

  const handleFormChange = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
      reader.readAsDataURL(file)
    })

  const handleMainImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    handleFormChange('image', dataUrl)
    if (!form.images.length) {
      handleFormChange('images', [dataUrl])
    }
  }

  const handleGalleryUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return
    const urls = await Promise.all(files.map(fileToDataUrl))
    handleFormChange('images', urls)
    if (!form.image) {
      handleFormChange('image', urls[0])
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.image || !form.category) {
      return
    }

    const parsedMaterials = materialsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    const normalizedForm: ProductForm = {
      ...form,
      images: form.images?.length ? form.images : [form.image],
      materials: parsedMaterials.length ? parsedMaterials : ['Material reciclado']
    }

    const saveProduct = async () => {
      try {
        if (editingId) {
          // Actualizar producto existente
          const productRef = doc(db, 'products', editingId);
          await updateDoc(productRef, normalizedForm);
          setProducts((prev) =>
            prev.map((product) =>
              product.id === editingId ? { ...product, ...normalizedForm } : product
            )
          );
          console.log('Producto actualizado en Firestore:', editingId);
        } else {
          // Agregar nuevo producto
          const docRef = await addDoc(collection(db, 'products'), normalizedForm);
          setProducts((prev) => [
            { id: docRef.id, ...normalizedForm },
            ...prev
          ]);
          console.log('Producto agregado en Firestore:', docRef.id);
        }
        setEditingId(null);
        setForm(emptyForm);
        setMaterialsText('');
      } catch (error) {
        console.error('Error guardando producto en Firestore:', error);
        alert('Error guardando producto en Firestore. Revisa la consola.');
      }
    };
    saveProduct();
  }

  const handleEdit = useCallback((product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      price: product.price,
      image: product.image,
      images: product.images ?? [],
      description: product.description,
      materials: product.materials ?? [],
      story: product.story ?? '',
      category: product.category,
      isNew: product.isNew ?? false,
      limited: product.limited ?? false,
      featured: product.featured ?? false
    })
    setMaterialsText((product.materials ?? []).join(', '))
  }, [])

  const handleDelete = (id: string) => {
    const confirmDelete = window.confirm('¿Eliminar este producto?')
    if (!confirmDelete) return
    const deleteProduct = async () => {
      try {
        await deleteDoc(doc(db, 'products', id));
        const updatedProducts = products.filter((product) => product.id !== id);
        setProducts(updatedProducts);
        if (editingId === id) {
          setEditingId(null);
          setForm(emptyForm);
        }
        console.log('Producto eliminado en Firestore:', id);
      } catch (error) {
        console.error('Error eliminando producto en Firestore:', error);
        alert('Error eliminando producto en Firestore. Revisa la consola.');
      }
    };
    deleteProduct();
  }

  const resetForm = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setMaterialsText('')
  }, [])

  const ProductDetailPage = () => {
    const { id } = useParams()
    const product = products.find((item) => item.id === id)
    const [activeImage, setActiveImage] = useState('')

    useEffect(() => {
      if (product) {
        setActiveImage(product.image)
      }
    }, [product])

    if (!product) {
      return (
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-semibold text-slate-900">Producto no encontrado</h2>
            <p className="mt-2 text-sm text-slate-600">
              No pudimos encontrar este producto. Explora el catálogo para ver más piezas.
            </p>
            <button
              onClick={() => navigate('/catalogo')}
              className="mt-6 rounded-full bg-[#2F5D50] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
            >
              Ver catálogo
            </button>
          </div>
        </main>
      )
    }

    const related = products.filter(
      (item) => item.category === product.category && item.id !== product.id
    )

    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
              <img
                src={activeImage || product.image}
                alt={product.name}
                className="h-96 w-full object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(product.images?.length ? product.images : [product.image])
                .slice(0, 3)
                .map((image, index) => (
                <img
                  key={`${product.id}-${index}`}
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  onClick={() => setActiveImage(image)}
                  className={`h-32 w-full cursor-pointer rounded-2xl object-cover ring-2 ring-transparent transition ${
                    image === activeImage ? 'ring-[#2F5D50]' : 'hover:ring-[#7A9E7E]'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-8 shadow-xl">
            <div className="flex flex-wrap gap-2">
              {product.isNew && (
                <span className="rounded-full bg-[#7A9E7E] px-3 py-1 text-xs font-semibold text-white">
                  Nuevo
                </span>
              )}
              {product.limited && (
                <span className="rounded-full bg-[#8B5E3C] px-3 py-1 text-xs font-semibold text-white">
                  Edición limitada
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-2 text-sm text-slate-600">{product.description}</p>
            <p className="mt-4 text-2xl font-semibold text-[#2F5D50]">
              ${product.price.toFixed(2)}
            </p>
            <div className="mt-6 flex w-full min-w-0 flex-col gap-3">
              <a
                href={buildWhatsappLink(product.name)}
                target="_blank"
                rel="noreferrer"
                className="box-border inline-flex h-11 w-full items-center justify-center rounded-full border border-[#2F5D50] px-6 text-sm font-semibold text-[#2F5D50] no-underline hover:bg-[#2F5D50] hover:text-white"
              >
                Preguntar por WhatsApp
              </a>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">
                  Materiales usados
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {(product.materials ?? []).map((material) => (
                    <li key={material}>{material}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">
                  Información de envío
                </p>
                <p className="mt-2">Envíos seguros a todo México en 3-5 días hábiles.</p>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-slate-900">Productos relacionados</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((item) => (
                <article key={item.id} className="rounded-3xl bg-white p-5 shadow-xl">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-44 w-full rounded-2xl object-cover"
                  />
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">${item.price.toFixed(2)}</p>
                    <button
                      onClick={() => navigate(`/producto/${item.id}`)}
                      className="mt-4 rounded-full border border-[#2F5D50] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Ver producto
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F1EA] text-slate-900">
      <header className="border-b border-[#E8D8C3] bg-[#F5F1EA]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F5D50] text-sm font-semibold text-white">
                AP
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Artesanías Pikis</p>
                <p className="text-xs text-slate-500">Tradición hecha a mano</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Abrir menú"
                className="ml-auto inline-flex items-center justify-center rounded-full border border-[#E8D8C3] p-2 text-[#2F5D50] hover:border-[#7A9E7E] md:hidden"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
                </svg>
              </button>
            </div>
            <nav className="hidden flex-wrap gap-2 md:flex">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-xs font-semibold transition ${
                      isActive
                          ? 'bg-[#2F5D50] text-white'
                          : 'border border-[#E8D8C3] text-[#2F5D50] hover:border-[#7A9E7E]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          {isMenuOpen && (
            <nav className="mt-4 grid gap-2 md:hidden">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                          ? 'bg-[#2F5D50] text-white'
                          : 'border border-[#E8D8C3] text-[#2F5D50] hover:border-[#7A9E7E]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
        {isHome && (
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="animate-fade-up">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  Artesanías Pikis
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                  Artesanía contemporánea
                  <span className="block text-slate-500">para hogares con identidad</span>
                </h1>
                <p className="mt-5 max-w-xl text-base text-slate-600">
                  Curaduría de piezas únicas hechas a mano. Materiales locales, diseño
                  atemporal y producción responsable.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Envíos nacionales
                  </span>
                  <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Ediciones limitadas
                  </span>
                  <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Hecho a mano
                  </span>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/catalogo')}
                    className="rounded-full bg-[#2F5D50] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
                  >
                    Ver catálogo
                  </button>
                  <button
                    onClick={() => navigate('/sobre')}
                    className="rounded-full border border-[#2F5D50] px-6 py-3 text-sm font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                  >
                    Conoce nuestra historia
                  </button>
                </div>
              </div>
              <div className="glass animate-float rounded-3xl px-7 py-6 text-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">
                  Taller y tienda
                </p>
                <p className="mt-2 text-2xl font-semibold">Tuxtla Gutiérrez, Chis.</p>
                <p className="text-sm text-slate-500">
                  Av. 10A. Sur Pte. 553 B, San Francisco, 29066 Tuxtla Gutiérrez, Chis.
                </p>
                <div className="mt-4 rounded-2xl bg-[#E8D8C3] px-4 py-3 text-xs text-[#2F5D50]">
                  Atención Lun - Sáb · 9:00 - 18:00 · Tel. 961 1 228 702
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                <div className="animate-fade-up rounded-3xl bg-white p-8 shadow-xl">
                  <p className="text-sm font-semibold text-[#2F5D50]">INICIO</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">
                    Artesanía con segunda vida ♻️
                  </h2>
                  <p className="mt-3 text-base text-slate-600">
                    Hecho a mano, hecho con conciencia. Piezas únicas elaboradas con
                    materiales reciclados que cuidan el planeta.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => navigate('/catalogo')}
                      className="rounded-full bg-[#2F5D50] px-6 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
                    >
                      Ver catálogo
                    </button>
                    <button
                      onClick={() => navigate('/sobre')}
                      className="rounded-full border border-[#2F5D50] px-6 py-3 text-sm font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Conoce nuestra historia
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-3xl shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1459156212016-c812468e2115?auto=format&fit=crop&w=1200&q=80"
                    alt="Artesanías Pikis"
                    className="h-full w-full object-cover"
                  />
                </div>
              </section>

              <section className="mt-12 grid gap-6 md:grid-cols-3">
                {[
                  {
                    title: 'Productos artesanales',
                    text: 'Piezas únicas con diseño auténtico y tradición local.'
                  },
                  {
                    title: 'Materiales reciclados',
                    text: 'Reutilizamos fibras, telas y envases para una segunda vida.'
                  },
                  {
                    title: 'Únicos y sustentables',
                    text: 'Cada pieza tiene historia y reduce el impacto ambiental.'
                  }
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl bg-white p-6 shadow-xl">
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{item.text}</p>
                  </div>
                ))}
              </section>

              <section className="mt-12">
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-slate-900">Productos destacados</h2>
                  <p className="text-sm text-slate-600">
                    Nuestros favoritos de temporada.
                  </p>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((product) => (
                    <article
                      key={product.id}
                      className="card-hover rounded-3xl bg-white p-5 shadow-xl"
                    >
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-48 w-full rounded-2xl object-cover"
                        />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                          {product.isNew && (
                            <span className="rounded-full bg-[#7A9E7E] px-3 py-1 text-xs font-semibold text-white">
                              Nuevo
                            </span>
                          )}
                          {product.limited && (
                            <span className="rounded-full bg-[#8B5E3C] px-3 py-1 text-xs font-semibold text-white">
                              Edición limitada
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-lg font-semibold text-[#2F5D50]">
                            ${product.price.toFixed(2)}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/producto/${product.id}`)}
                              className="rounded-full bg-[#2F5D50] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7A9E7E]"
                            >
                              Ver
                            </button>
                            <a
                              href={buildWhatsappLink(product.name)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-[#2F5D50] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-12 rounded-3xl bg-white p-8 shadow-xl">
                <h2 className="text-2xl font-semibold text-slate-900">¿Por qué elegirnos?</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {[
                    '♻️ Materiales reciclados',
                    '🖐️ Hecho a mano en taller propio',
                    '🌎 Consumo responsable y consciente',
                    '🚚 Envíos seguros y empaques eco'
                  ].map((item) => (
                    <div key={item} className="rounded-2xl bg-[#F5F1EA] px-5 py-4 text-sm text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-12">
                <h2 className="text-2xl font-semibold text-slate-900">Opiniones</h2>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  {[
                    {
                      name: 'Mariana López',
                      quote: 'La calidad y la historia detrás de cada pieza es increíble.'
                    },
                    {
                      name: 'José Méndez',
                      quote: 'Compré un bolso y recibí una obra de arte sostenible.'
                    },
                    {
                      name: 'Carla Ríos',
                      quote: 'Me encanta cuidar el planeta al mismo tiempo.'
                    }
                  ].map((item) => (
                    <div key={item.name} className="rounded-3xl bg-white p-6 shadow-xl">
                      <p className="text-sm text-slate-600">“{item.quote}”</p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#7A9E7E]">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-12 rounded-3xl bg-[#2F5D50] p-10 text-white">
                <h2 className="text-3xl font-semibold">
                  Descubre piezas únicas y dale una segunda vida al planeta
                </h2>
                <p className="mt-3 text-sm text-white/80">
                  Catálogo curado, historias reales y compromiso sustentable.
                </p>
                <button
                  onClick={() => navigate('/catalogo')}
                  className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#2F5D50] hover:bg-[#E8D8C3]"
                >
                  VER CATÁLOGO
                </button>
              </section>
            </main>
          }
        />
        <Route
          path="/catalogo"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900">Catálogo / Tienda</h2>
                  <p className="text-sm text-slate-600">
                    Encuentra artesanías sustentables por categoría, material o precio.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuery('')
                    setCategoryFilter('Todos')
                    setMaterialFilter('Todos')
                    setPriceMin('')
                    setPriceMax('')
                    setOnlyNew(false)
                  }}
                  className="rounded-full border border-[#E8D8C3] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:border-[#7A9E7E]"
                >
                  Limpiar filtros
                </button>
              </div>

              <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex flex-wrap gap-3">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar producto"
                    className="w-full rounded-full border border-[#E8D8C3] bg-white px-4 py-2 text-sm focus:border-[#2F5D50] focus:outline-none md:w-64"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="w-full rounded-full border border-[#E8D8C3] bg-white px-4 py-2 text-sm focus:border-[#2F5D50] focus:outline-none md:w-44"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={materialFilter}
                    onChange={(event) => setMaterialFilter(event.target.value)}
                    className="w-full rounded-full border border-[#E8D8C3] bg-white px-4 py-2 text-sm focus:border-[#2F5D50] focus:outline-none md:w-52"
                  >
                    {materials.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                  <input
                    value={priceMin}
                    onChange={(event) => setPriceMin(event.target.value)}
                    placeholder="Precio mínimo"
                    type="number"
                    min="0"
                    className="w-full rounded-full border border-[#E8D8C3] bg-white px-4 py-2 text-sm focus:border-[#2F5D50] focus:outline-none md:w-40"
                  />
                  <input
                    value={priceMax}
                    onChange={(event) => setPriceMax(event.target.value)}
                    placeholder="Precio máximo"
                    type="number"
                    min="0"
                    className="w-full rounded-full border border-[#E8D8C3] bg-white px-4 py-2 text-sm focus:border-[#2F5D50] focus:outline-none md:w-40"
                  />
                </div>
                <label className="mt-4 flex items-center gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={(event) => setOnlyNew(event.target.checked)}
                    className="h-4 w-4 rounded border-[#7A9E7E] text-[#2F5D50] focus:ring-[#7A9E7E]"
                  />
                  Mostrar solo nuevos
                </label>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((product) => (
                  <article
                    key={product.id}
                    className="card-hover group animate-fade-in rounded-3xl bg-white p-5 shadow-xl"
                  >
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-48 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-[1.02]"
                      />
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        {product.isNew && (
                          <span className="rounded-full bg-[#7A9E7E] px-3 py-1 text-xs font-semibold text-white">
                            Nuevo
                          </span>
                        )}
                        {product.limited && (
                          <span className="rounded-full bg-[#8B5E3C] px-3 py-1 text-xs font-semibold text-white">
                            Edición limitada
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{product.description}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-lg font-semibold text-[#2F5D50]">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="rounded-full bg-[#E8D8C3] px-3 py-1 text-xs text-[#2F5D50]">
                          {product.category}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/producto/${product.id}`)}
                          className="rounded-full bg-[#2F5D50] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7A9E7E]"
                        >
                          Ver
                        </button>
                        <a
                          href={buildWhatsappLink(product.name)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#2F5D50] px-3 py-2 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                        >
                          WhatsApp
                        </a>
                        {isAuthed && (
                          <>
                            <button
                              onClick={() => navigate(`/admin/edit/${product.id}`)}
                              className="rounded-full border border-[#2F5D50] px-3 py-2 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </main>
          }
        />
        <Route path="/producto/:id" element={<ProductDetailPage />} />
        <Route
          path="/admin/new"
          element={
            <EditProductPage
              isAuthed={isAuthed}
              loginUser={loginUser}
              setLoginUser={setLoginUser}
              loginPass={loginPass}
              setLoginPass={setLoginPass}
              loginError={loginError}
              handleLogin={handleLogin}
              resetForm={resetForm}
              products={products}
              form={form}
              materialsText={materialsText}
              setMaterialsText={setMaterialsText}
              handleFormChange={handleFormChange}
              handleSubmit={handleSubmit}
              handleMainImageUpload={handleMainImageUpload}
              handleGalleryUpload={handleGalleryUpload}
              handleEdit={handleEdit}
            />
          }
        />
        <Route
          path="/admin/edit/:id"
          element={
            <EditProductPage
              isAuthed={isAuthed}
              loginUser={loginUser}
              setLoginUser={setLoginUser}
              loginPass={loginPass}
              setLoginPass={setLoginPass}
              loginError={loginError}
              handleLogin={handleLogin}
              resetForm={resetForm}
              products={products}
              form={form}
              materialsText={materialsText}
              setMaterialsText={setMaterialsText}
              handleFormChange={handleFormChange}
              handleSubmit={handleSubmit}
              handleMainImageUpload={handleMainImageUpload}
              handleGalleryUpload={handleGalleryUpload}
              handleEdit={handleEdit}
            />
          }
        />
        <Route
          path="/sobre"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900">Sobre nosotros</h2>
                  <p className="mt-3 text-base text-slate-600">
                    Artesanías Pikis nace del deseo de rescatar técnicas tradicionales y
                    dar nueva vida a materiales reciclados. Cada pieza cuenta una historia
                    de comunidad, creatividad y conciencia ecológica.
                  </p>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#E8D8C3] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                        Misión
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Impulsar el trabajo artesanal local con prácticas sostenibles y
                        comercio justo, ofreciendo piezas auténticas y responsables.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#E8D8C3] bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                        Visión
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        Ser una referencia nacional en artesanías sustentables, conectando
                        tradición, diseño contemporáneo y conciencia ambiental.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl bg-[#E8D8C3] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                      Ubicación
                    </p>
                    <p className="mt-2 text-sm text-[#2F5D50]">
                      Av. 10A. Sur Pte. 553 B, San Francisco, 29066 Tuxtla Gutiérrez, Chis.
                    </p>
                    <p className="mt-2 text-xs text-[#2F5D50]">
                      Tel. 961 1 228 702 · Envíos a todo el país.
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3 text-xs">
                    <a
                      href="https://www.facebook.com/p/Artesan%C3%ADas-Pikys-100054419910160/"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#2F5D50] px-4 py-2 font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://maps.app.goo.gl/H5FYBBNiTnxzBjtS6"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-[#2F5D50] px-4 py-2 font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Ver en Google Maps
                    </a>
                  </div>
                </div>
                <div className="grid gap-4">
                  <img
                    src="https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80"
                    alt="Artesana trabajando"
                    className="h-64 w-full rounded-3xl object-cover"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80"
                    alt="Materiales reciclados"
                    className="h-64 w-full rounded-3xl object-cover"
                  />
                </div>
              </div>
            </main>
          }
        />
        <Route
          path="/impacto"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="rounded-3xl bg-white p-10 shadow-xl">
                <h2 className="text-3xl font-semibold text-slate-900">Impacto y sustentabilidad</h2>
                <p className="mt-3 text-base text-slate-600">
                  Nuestro compromiso ambiental se refleja en cada decisión: reutilizamos
                  materiales, reducimos desperdicios y promovemos consumo responsable.
                </p>
                <div className="mt-8 grid gap-6 md:grid-cols-3">
                  {[
                    {
                      title: 'Materiales reciclados',
                      value: '70% de insumos reutilizados'
                    },
                    {
                      title: 'Producción consciente',
                      value: 'Lotes pequeños y cero desperdicio'
                    },
                    {
                      title: 'Impacto local',
                      value: 'Compromiso directo con producción responsable'
                    }
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl bg-[#F5F1EA] p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5D50]">
                        {item.title}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#E8D8C3] bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Proceso artesanal</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Seleccionamos materiales recuperados, limpiamos, preparamos y
                      transformamos cada pieza con técnicas tradicionales.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#E8D8C3] bg-white p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Compromiso ambiental</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Empaques reciclables, tintes naturales y logística optimizada para
                      reducir emisiones.
                    </p>
                  </div>
                </div>
              </div>
            </main>
          }
        />
        <Route
          path="/faq"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="rounded-3xl bg-white p-8 shadow-xl">
                <h2 className="text-3xl font-semibold text-slate-900">Preguntas frecuentes</h2>
                <div className="mt-6 space-y-4">
                  {[
                    {
                      q: '¿Cuánto tarda el envío?',
                      a: 'De 3 a 5 días hábiles dentro de México. Te compartimos guía de rastreo.'
                    },
                    {
                      q: '¿Aceptan devoluciones?',
                      a: 'Sí, dentro de los primeros 7 días si el producto llega con daño.'
                    },
                    {
                      q: '¿Son realmente reciclados?',
                      a: 'Sí, usamos materiales recuperados y procesos responsables certificados.'
                    },
                    {
                      q: '¿Hacen personalizados?',
                      a: 'Sí, escríbenos por WhatsApp con tu idea y te cotizamos.'
                    }
                  ].map((item) => (
                    <div key={item.q} className="rounded-2xl border border-[#E8D8C3] bg-[#F5F1EA] p-4">
                      <p className="text-sm font-semibold text-[#2F5D50]">{item.q}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          }
        />
        <Route
          path="/blog"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-semibold text-slate-900">Blog</h2>
                <p className="text-sm text-slate-600">
                  Ideas sostenibles, proceso creativo y consejos para reciclar con estilo.
                </p>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {blogPosts.map((post) => (
                  <article key={post.id} className="rounded-3xl bg-white p-6 shadow-xl">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-40 w-full rounded-2xl object-cover"
                    />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{post.excerpt}</p>
                    <button
                      onClick={() => setActivePost(post)}
                      className="mt-4 rounded-full border border-[#2F5D50] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Leer más
                    </button>
                  </article>
                ))}
              </div>
              {activePost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
                    <button
                      onClick={() => setActivePost(null)}
                      className="absolute right-4 top-4 rounded-full border border-[#E8D8C3] px-3 py-1 text-xs font-semibold text-[#2F5D50] hover:bg-[#2F5D50] hover:text-white"
                    >
                      Cerrar
                    </button>
                    <img
                      src={activePost.image}
                      alt={activePost.title}
                      className="h-56 w-full rounded-2xl object-cover"
                    />
                    <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                      {activePost.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600">{activePost.content}</p>
                  </div>
                </div>
              )}
            </main>
          }
        />
        <Route
          path="/admin"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              {!isAuthed ? (
                <div className="mx-auto max-w-md animate-fade-up rounded-3xl bg-white p-8 shadow-xl">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Acceso administrador
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Ingresa tus credenciales para gestionar el catálogo.
                  </p>
                  <form onSubmit={handleLogin} className="mt-6 space-y-4">
                    <input
                      value={loginUser}
                      onChange={(event) => setLoginUser(event.target.value)}
                      placeholder="Usuario"
                      className="w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
                    />
                    <input
                      type="password"
                      value={loginPass}
                      onChange={(event) => setLoginPass(event.target.value)}
                      placeholder="Contraseña"
                      className="w-full rounded-xl border border-[#E8D8C3] px-4 py-3 text-sm focus:border-[#2F5D50] focus:outline-none"
                    />
                    {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#2F5D50] px-4 py-3 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
                    >
                      Ingresar
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid gap-8">
                  <section className="animate-fade-up rounded-3xl bg-white p-6 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">
                          Gestión de productos
                        </h2>
                        <p className="text-sm text-slate-500">
                          Administra tu catálogo en tiempo real.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => navigate('/admin/new')}
                          className="rounded-full bg-[#2F5D50] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7A9E7E]"
                        >
                          Crear producto
                        </button>
                        <button
                          onClick={handleLogout}
                          className="rounded-full border border-[#E8D8C3] px-4 py-2 text-xs font-semibold text-[#2F5D50] hover:border-[#7A9E7E] hover:text-[#2F5D50]"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="card-hover flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {product.category} · ${product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/admin/edit/${product.id}`)}
                              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#2F5D50] shadow-sm hover:text-[#2F5D50]"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-red-500 shadow-sm hover:text-red-600"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </main>
          }
        />
        <Route
          path="*"
          element={
            <main className="mx-auto max-w-6xl px-6 py-12">
              <div className="rounded-3xl bg-white p-8 shadow-xl">
                <h2 className="text-2xl font-semibold text-slate-900">Página no encontrada</h2>
                <p className="mt-2 text-sm text-slate-500">
                  La ruta {location.pathname} no existe.
                </p>
                <NavLink
                  to="/"
                  className="mt-4 inline-flex rounded-full bg-[#2F5D50] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7A9E7E]"
                >
                  Volver al catálogo
                </NavLink>
              </div>
            </main>
          }
        />
      </Routes>

      <footer className="border-t border-[#E8D8C3] bg-[#F5F1EA]">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-[#2F5D50]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <span>© 2026 Artesanías Pikis. Todos los derechos reservados.</span>
            <div className="flex items-center gap-3">
              <a
                href={buildWhatsappChatLink()}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-[#E8D8C3] p-2 text-[#2F5D50] hover:border-[#7A9E7E] hover:text-[#2F5D50]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.91 11.91 0 0 0 12.06 0C5.46.03.1 5.4.1 12c0 2.11.55 4.17 1.6 5.98L0 24l6.2-1.63a11.92 11.92 0 0 0 5.86 1.5h.01c6.6 0 11.97-5.37 12-11.97a11.9 11.9 0 0 0-3.55-8.42Zm-8.46 18.4h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.68.97.98-3.58-.24-.37A9.9 9.9 0 0 1 2.1 12C2.13 6.51 6.6 2.05 12.06 2.05c2.64 0 5.12 1.03 6.98 2.9a9.83 9.83 0 0 1 2.9 6.98c-.03 5.46-4.5 9.95-9.88 9.95Zm5.45-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.66.15-.19.3-.76.97-.93 1.17-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.5-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.5.15-.17.2-.29.3-.48.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.2-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.5 0 1.48 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.09 4.49.71.31 1.27.5 1.7.64.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.08-.13-.27-.2-.57-.35Z" />
                </svg>
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-[#E8D8C3] p-2 text-[#2F5D50] hover:border-[#7A9E7E] hover:text-[#2F5D50]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.25.2 2.25.2v2.47h-1.27c-1.25 0-1.64.78-1.64 1.57V12h2.8l-.45 2.88h-2.35v6.99A10 10 0 0 0 22 12Z" />
                </svg>
              </a>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Ubicación"
                className="rounded-full border border-[#E8D8C3] p-2 text-[#2F5D50] hover:border-[#7A9E7E] hover:text-[#2F5D50]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

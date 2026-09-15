import { useEffect, useState } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";
import {
  Users,
  Award,
  Heart,
  ChefHat,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 40 },
    visible: { opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' } },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.08 } },
  };

  const slideFromLeft: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : -60 },
    visible: { opacity: 1, x: 0, transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' } },
  };

  const slideFromRight: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 60 },
    visible: { opacity: 1, x: 0, transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' } },
  };

  const scaleIn: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' } },
  };

  const [hero, setHero] = useState({
    hero_heading: "",
    hero_description: "",
    hero_button_text: "",
    hero_button_link: "",
    hero_button_enabled: true,
    hero_image_url: "",
  });
  const [stats, setStats] = useState<any[]>([]);
  const [mission, setMission] = useState({
    title: "",
    paragraph1: "",
    paragraph2: "",
    paragraph3: "",
    image_url: "",
  });
  const [values, setValues] = useState<any[]>([]);
const [store, setStore] = useState({
  name: "",
  address: "",
  phone: "",
  email: "",
  working_days: "",
  opening_time: "",
  closing_time: "",
  image_url: "",
  maps_link: "",
});
const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function loadHero() {
      const { data } = await supabase
        .from("about_page")
        .select(
          `
          hero_heading,
          hero_description,
          hero_button_text,
          hero_button_link,
          hero_button_enabled,
          hero_image_url
        `
        )
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        setHero({
          hero_heading: data.hero_heading ?? "",
          hero_description: data.hero_description ?? "",
          hero_button_text: data.hero_button_text ?? "",
          hero_button_link: data.hero_button_link ?? "",
          hero_button_enabled: data.hero_button_enabled ?? true,
          hero_image_url: data.hero_image_url ?? "",
        });
      }
    }

    async function loadStats() {
      const { data } = await supabase
        .from("about_statistics")
        .select("*")
        .order("display_order");

      if (data) setStats(data);
    }

    async function loadMission() {
      const { data } = await supabase
        .from("about_page")
        .select(
          `
          mission_title,
          mission_paragraph_1,
          mission_paragraph_2,
          mission_paragraph_3,
          mission_image_url
        `
        )
        .eq("id", 1)
        .single();

      if (data) {
        setMission({
  title: data.mission_title ?? "",
  paragraph1: data.mission_paragraph_1 ?? "",
  paragraph2: data.mission_paragraph_2 ?? "",
  paragraph3: data.mission_paragraph_3 ?? "",
  image_url: data.mission_image_url ?? "",
});
      }
    }

    async function loadValues() {
      const { data } = await supabase
        .from("about_values")
        .select("*")
        .order("display_order");

      if (data) setValues(data);
    }
async function loadStore() {
  const { data } = await supabase
    .from("about_page")
    .select(`
      store_name,
      store_address,
      store_phone,
      store_email,
      store_working_days,
      store_opening_time,
      store_closing_time,
      store_image_url,
      store_maps_link
    `)
    .eq("id", 1)
    .single();

  if (data) {
    setStore({
      name: data.store_name ?? "",
      address: data.store_address ?? "",
      phone: data.store_phone ?? "",
      email: data.store_email ?? "",
      working_days: data.store_working_days ?? "",
      opening_time: data.store_opening_time ?? "",
      closing_time: data.store_closing_time ?? "",
      image_url: data.store_image_url ?? "",
      maps_link: data.store_maps_link ?? "",
    });
  }
}
    async function loadPage() {
  await Promise.all([
    loadHero(),
    loadStats(),
    loadMission(),
    loadValues(),
    loadStore(),
  ]);

  setLoading(false);
}

loadPage();
  }, []);

  const iconMap: Record<string, any> = {
    users: Users,
    award: Award,
    heart: Heart,
    "chef-hat": ChefHat,
  };
if (loading) return null;
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <motion.section
        className="text-white py-16 md:py-24 bg-cover bg-center"
        style={{
          backgroundImage: hero.hero_image_url
            ? `linear-gradient(rgba(17,24,39,.75), rgba(30,64,175,.75)), url(${hero.hero_image_url})`
            : undefined,
        }}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              {hero.hero_heading}
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              {hero.hero_description}
            </p>
            {hero.hero_button_enabled && hero.hero_button_text && (
              <a
                href={hero.hero_button_link}
                className="inline-flex mt-8 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition"
              >
                {hero.hero_button_text}
              </a>
            )}
          </div>
        </div>
      </motion.section>
      <section className="bg-white py-12 md:py-16">
        <div className="container-custom">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {stats.map((stat: any) => (
              <motion.div key={stat.id} variants={fadeUp} className="text-center">
                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const Icon = iconMap[stat.icon] || Users;
                    return <Icon className="w-8 h-8 text-primary-600" />;
                  })()}
                </div>

                <p className="text-3xl md:text-4xl font-bold text-gray-900">
                  {stat.value}
                </p>

                <p className="text-gray-600 mt-2 text-sm font-medium">
                  {stat.title}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <motion.div
              className="relative h-[500px] lg:h-[550px] overflow-hidden rounded-2xl shadow-xl"
              variants={slideFromLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <img
                src={mission.image_url}
                alt={mission.title}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.pexels.com/photos/4226806/pexels-photo-4226806.jpeg?auto=compress&cs=tinysrgb&w=1200";
                }}
              />
            </motion.div>
            <motion.div
              variants={slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                {mission.title}
              </h2>

              <div className="space-y-6 text-lg leading-8 text-gray-600">
                {mission.paragraph1 && <p>{mission.paragraph1}</p>}
                {mission.paragraph2 && <p>{mission.paragraph2}</p>}
                {mission.paragraph3 && <p>{mission.paragraph3}</p>}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center mb-12">Our Values</h2>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {values.map((value: any, index: number) => (
              <motion.div
                key={value.id}
                variants={fadeUp}
                className="bg-gray-50 rounded-xl p-6 hover:bg-primary-50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl font-bold">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <h2 className="section-title mb-6">Visit Our Store</h2>
              <div className="bg-white rounded-xl p-6 mb-6">
                <div className="space-y-4 text-gray-600">
                  <p className="flex items-start gap-3">
                    <span className="font-medium text-gray-900">Address:</span>
                    {store.address}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">Phone:</span>
                    {store.phone}
                  </p>
                  <p className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">Email:</span>
                    {store.email}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 space-y-4 text-gray-600">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Store Hours:</p>
                  <p>{store.working_days}: {store.opening_time} - {store.closing_time}</p>
                  <p></p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="aspect-video bg-gray-200 rounded-xl overflow-hidden"
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <a
                href={store.maps_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={store.image_url}
                  alt={store.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.pexels.com/photos/4227055/pexels-photo-4227055.jpeg?auto=compress&cs=tinysrgb&w=800";
                  }}
                />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        className="py-12 md:py-16 lg:py-20 bg-primary-600 text-white"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="container-custom text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Upgrade Your Kitchen?
          </h2>
          <p className="text-primary-100 mb-8 max-w-xl mx-auto">
            Browse our collection of premium kitchen tools and equipment today.
          </p>
          <a href="/products" className="btn-accent">
            Shop Now
          </a>
        </div>
      </motion.section>
    </div>
  );
}
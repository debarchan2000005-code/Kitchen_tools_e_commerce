import { useState, useEffect } from 'react';
import { motion, useReducedMotion, Variants } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ContactPage() {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 40 },
    visible: { opacity: 1, y: 0, transition: { duration: shouldReduceMotion ? 0 : 0.5, ease: 'easeOut' } },
  };

  const slideFromLeft: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : -50 },
    visible: { opacity: 1, x: 0, transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: 'easeOut' } },
  };

  const slideFromRight: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : 50 },
    visible: { opacity: 1, x: 0, transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: 'easeOut' } },
  };

  const fadeIn: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: { opacity: 1, transition: { duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' } },
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: submitError } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (submitError) throw submitError;

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  async function loadPage() {
    const { data } = await supabase
      .from("contact_page")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setPage(data);
    }

    setPageLoading(false);
  }

  loadPage();
}, []);
  const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    content: page?.address,
    href: null,
  },
  {
    icon: Phone,
    title: "Phone",
    content: page?.phone,
    href: `tel:${page?.phone}`,
  },
  {
    icon: Mail,
    title: "Email",
    content: page?.email,
    href: `mailto:${page?.email}`,
  },
  {
    icon: Clock,
    title: "Hours",
    content: page?.hours,
    href: null,
  },
];

const subjects: string[] = page?.subjects ?? [];
    if (pageLoading) return null;
  return (
    <div className="animate-fade-in">

      <motion.section
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white py-16 md:py-20"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{page.hero_heading}</h1>
          <p className="text-gray-300 max-w-xl">
            {page.hero_description}
          </p>
        </div>
      </motion.section>

      
      <section className="py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
                  <motion.div
              className="bg-white rounded-xl p-6 md:p-8 shadow-sm"
              variants={slideFromRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6">{page.form_heading}</h2>

              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Your name"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="your@email.com"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="input"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map((subj) => (
                        <option key={subj} value={subj}>
                          {subj}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="How can we help you?"
                      className="input resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 disabled:opacity-50"
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
            <div className="space-y-6">
              <motion.div
                variants={slideFromLeft}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">{page.get_in_touch_heading}</h2>
                <p className="text-gray-600 mb-8">
                  {page.get_in_touch_description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm"
                  >
                    <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                      <info.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{info.title}</p>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-gray-600 hover:text-primary-600 transition-colors"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-gray-600">{info.content}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="bg-primary-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">
                  {page.faq_heading}
                </h3>
                <p className="text-gray-600 mb-4">
                  {page.faq_description}
                </p>
                <a href={page.faq_link_url}   className="text-primary-600 font-medium hover:text-primary-700">
                  {page.faq_link_text}&rarr;
                </a>
              </div>
              </motion.div>
              <motion.div
                className="aspect-video bg-gray-200 rounded-xl overflow-hidden relative"
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <img
                    src={page.map_image_url}
                  alt="Location"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <a
                    href={page.map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary bg-white text-gray-900 hover:bg-gray-100"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    View on Map
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
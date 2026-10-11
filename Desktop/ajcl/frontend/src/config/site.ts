/** Brand + contact information for AJ Courier & Logistics. */
export const site = {
  name: "AJ Courier & Logistics",
  shortName: "AJ Courier",
  tagline: "Fast, Reliable & Dependable",
  description:
    "Book a rider in minutes. Same-day pickup and delivery across Nigeria — fast, reliable & dependable.",
  contact: {
    phone: "+234 813 759 8694",
    phoneHref: "tel:+2348137598694",
    whatsappHref: "https://wa.me/2348137598694",
    email: "info@ajcourierlogistics.com",
    instagram: "https://ig.me/m/ajclcourier",
    address: "Lagos, Nigeria",
  },
  legalName: "AJ Courier & Logistics",
  copyrightHolder: "AJ Courier & Logistics",
} as const;

export const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Services", href: "/#services" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/contact" },
] as const;

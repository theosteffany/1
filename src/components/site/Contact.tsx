import { Accent } from "@/components/ui/Accent";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, TikTokIcon } from "@/components/ui/Icons";
import { Reveal } from "@/components/ui/Reveal";
import { handleFromUrl, socialUrl } from "@/lib/utils";
import type { SiteSettings } from "@/lib/types";
import { ContactForm } from "./ContactForm";

export function Contact({ contact }: { contact: SiteSettings["contact"] }) {
  const rows = [
    contact.email && { icon: MailIcon, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.instagram && {
      icon: InstagramIcon,
      label: "Instagram",
      value: handleFromUrl(contact.instagram),
      href: socialUrl(contact.instagram, "instagram"),
    },
    contact.tiktok && {
      icon: TikTokIcon,
      label: "TikTok",
      value: handleFromUrl(contact.tiktok),
      href: socialUrl(contact.tiktok, "tiktok"),
    },
    contact.phone && { icon: PhoneIcon, label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    contact.location && { icon: PinIcon, label: "Based in", value: contact.location },
  ].filter(Boolean) as Array<{ icon: typeof MailIcon; label: string; value: string; href?: string }>;

  return (
    <section id="contact" className="section-y relative overflow-hidden bg-sand">
      <div className="container-x">
        <Reveal>
          <p className="eyebrow text-olive">Contact</p>
          <h2 className="display mt-5 text-[clamp(2.6rem,10.5vw,10.5rem)]">
            <Accent text={contact.heading} />
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-16 md:mt-20 md:grid-cols-12 md:gap-8">
          <Reveal className="md:col-span-5">
            {contact.intro && <p className="font-serif text-2xl leading-snug md:text-[1.75rem]">{contact.intro}</p>}
            <ul className="mt-10 divide-y divide-ink/15 border-y border-ink/15">
              {rows.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <>
                    <Icon className="h-5 w-5 shrink-0 text-olive" />
                    <span className="eyebrow w-24 shrink-0 text-[0.62rem] text-ink/55">{label}</span>
                    <span className="min-w-0 truncate text-base md:text-lg">{value}</span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-center gap-4 py-4 transition-colors hover:text-olive"
                        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 py-4">{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="md:col-span-6 md:col-start-7">
            <ContactForm fallbackEmail={contact.email} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

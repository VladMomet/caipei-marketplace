/**
 * Footer — нижняя часть сайта.
 *
 * Содержит ссылки на разделы, юридические документы, контакты,
 * указание юр. лица (ИП Оболенский Владимир) и 152-ФЗ.
 */

import Link from 'next/link'
import { LEGAL_ENTITY } from '@/lib/constants'

const SERVICE_LINKS = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/sourcing', label: 'Подбор' },
  { href: '/about', label: 'Доставка и ВЭД' },
]

const LEGAL_LINKS = [
  { href: '/legal/privacy', label: 'Политика конфиденциальности' },
  { href: '/legal/offer', label: 'Публичная оферта' },
  { href: '/legal/terms', label: 'Пользовательское соглашение' },
]

export function Footer() {
  return (
    <footer className="border-t border-ink-2 bg-ink text-paper">
      <div className="container mx-auto max-w-[1480px] px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-16">
          {/* Бренд */}
          <div>
            <div className="mb-6 flex items-center gap-2.5">
              <span className="chinese-seal h-9 w-9 text-lg">采</span>
              <span className="font-display text-xl font-medium leading-none">CaiPei</span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-paper/70">
              B2B-каталог проверенных фабрик в Китае с прозрачной ценой, ВЭД и пакетом документов.
              Прямая работа с производителями в Иу и Гуанчжоу.
            </p>
          </div>

          {/* Сервис */}
          <div>
            <h3 className="mb-4 font-mono text-[10.5px] uppercase tracking-wider text-paper/40">
              Сервис
            </h3>
            <ul className="space-y-2.5">
              {SERVICE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-paper/85 hover:text-cinnabar-3 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Документы */}
          <div>
            <h3 className="mb-4 font-mono text-[10.5px] uppercase tracking-wider text-paper/40">
              Документы
            </h3>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-paper/85 hover:text-cinnabar-3 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h3 className="mb-4 font-mono text-[10.5px] uppercase tracking-wider text-paper/40">
              Контакты
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`tel:${LEGAL_ENTITY.phone.replace(/\s/g, '')}`}
                  className="text-sm text-paper/85 hover:text-cinnabar-3 transition-colors"
                >
                  {LEGAL_ENTITY.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="text-sm text-paper/85 hover:text-cinnabar-3 transition-colors"
                >
                  {LEGAL_ENTITY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-4 border-t border-paper/15 pt-8 text-paper/40 md:grid-cols-2 md:items-start md:gap-8">
          <div className="space-y-1.5 font-mono text-[10.5px] uppercase tracking-wider leading-relaxed">
            <p>© 2026 CaiPei · {LEGAL_ENTITY.fullName}</p>
            <p>
              ИНН {LEGAL_ENTITY.inn} · ОГРНИП {LEGAL_ENTITY.ogrn}
            </p>
            <p className="normal-case tracking-normal text-paper/35">
              {LEGAL_ENTITY.address}
            </p>
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider md:text-right">
            Обработка ПДн по 152-ФЗ
          </p>
        </div>
      </div>
    </footer>
  )
}

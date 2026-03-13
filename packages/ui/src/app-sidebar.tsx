"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./sidebar"

export interface AppSidebarNavItem {
  label: string
  href: string
  icon: React.ElementType
  tooltip?: string
}

export interface AppSidebarLogoConfig {
  /** Render a custom React element as the logo (recommended for SVG logos — preserves web fonts) */
  element?: React.ReactNode
  /** Fallback: image src path */
  src?: string
  alt?: string
  width?: number
  height?: number
  href?: string
}

export interface AppSidebarFooterItem {
  label: string
  icon: React.ElementType
  href?: string
  onClick?: () => void
  tooltip?: string
}

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navItems: AppSidebarNavItem[]
  logo: AppSidebarLogoConfig
  footerItems?: AppSidebarFooterItem[]
  footerContent?: React.ReactNode
}

export function AppSidebar({
  navItems,
  logo,
  footerItems,
  footerContent,
  ...sidebarProps
}: AppSidebarProps) {
  const pathname = usePathname()
  const logoHref = logo.href ?? "/"

  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader className="px-4 py-4">
        <Link href={logoHref} className="flex items-center justify-center">
          {logo.element ?? (
            // eslint-disable-next-line @next/next/no-img-element
            <Image
              src={logo.src ?? "/logo.png"}
              alt={logo.alt ?? "logo"}
              width={logo.width}
              height={logo.height}
            />
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.tooltip ?? item.label}
                  size="lg"
                  className="rounded-xl px-3 my-1"
                >
                  <Link href={item.href}>
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {(footerContent || (footerItems && footerItems.length > 0)) && (
        <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
          {footerItems && footerItems.length > 0 && (
            <SidebarMenu>
              {footerItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild={!!item.href}
                    size="lg"
                    tooltip={item.tooltip ?? item.label}
                    onClick={item.href ? undefined : item.onClick}
                    className="rounded-xl px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 items-center"
                  >
                    {item.href ? (
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span>{item.label}</span>
                      </Link>
                    ) : (
                      <>
                        <item.icon className="size-5" />
                        <span>{item.label}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
          {footerContent && (
            <div className="px-1 pt-1">{footerContent}</div>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  )
}

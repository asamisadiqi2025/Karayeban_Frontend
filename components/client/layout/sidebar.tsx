// // "use client";

// // import { useState, useEffect, useRef } from "react";
// // import Link from "next/link";
// // import { usePathname } from "next/navigation";
// // import { ChevronRight, ChevronDown, X, LogOut } from "lucide-react";
// // import * as Collapsible from "@radix-ui/react-collapsible";

// // import { navSections } from "@/lib/nav-data";
// // import { cn } from "@/lib/utils";
// // import { LogoMark } from "@/components/icons/logo-mark";

// // interface SidebarProps {
// //   collapsed: boolean;
// //   onToggle: () => void;
// //   mobileOpen: boolean;
// //   onMobileClose: () => void;
// // }

// // export function Sidebar({
// //   collapsed,
// //   onToggle,
// //   mobileOpen,
// //   onMobileClose,
// // }: SidebarProps) {
// //   const pathname = usePathname();
// //   const [openItems, setOpenItems] = useState<string[]>([]);
// //   const [flyoutHref, setFlyoutHref] = useState<string | null>(null);
// //   const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

// //   // باز کردن خودکار زیرمنویی که آیتم فعال داخل آن است
// //   useEffect(() => {
// //     const parentToOpen = navSections
// //       .flatMap((section) => section.items)
// //       .find((item) => item.submenu?.some((sub) => sub.href === pathname));

// //     if (parentToOpen && !openItems.includes(parentToOpen.href)) {
// //       setOpenItems((prev) => [...prev, parentToOpen.href]);
// //     }
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [pathname]);

// //   const toggleItem = (href: string) => {
// //     setOpenItems((prev) =>
// //       prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
// //     );
// //   };

// //   // مدیریت hover برای flyout (با تاخیر کوچک تا لرزش نکنه)
// //   const handleMouseEnter = (href: string) => {
// //     if (closeTimer.current) clearTimeout(closeTimer.current);
// //     setFlyoutHref(href);
// //   };

// //   const handleMouseLeave = () => {
// //     closeTimer.current = setTimeout(() => setFlyoutHref(null), 150);
// //   };

// //   const content = (isMobile: boolean) => (
// //     <>
// //       {/* Brand */}
// //       <div className="flex h-24 shrink-0 items-center gap-2.5 px-5 border-b mb-1">
// //         <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary h-8 w-8">
// //           <LogoMark className="h-[18px] w-[18px] text-white" />
// //         </div>

// //         {(!collapsed || isMobile) && (
// //           <div className="leading-tight">
// //             <h1 className="font-brand text-lg font-bold text-white">
// //               کرایه‌بان
// //             </h1>
// //             <p className="text-[12px] tracking-wider text-sidebar-muted mt-1 text-left">
// //               داشبورد مدیریت مارکت
// //             </p>
// //           </div>
// //         )}

// //         {isMobile && (
// //           <button
// //             onClick={onMobileClose}
// //             className="mr-auto flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/[0.06] hover:text-white"
// //           >
// //             <X className="h-4 w-4" />
// //           </button>
// //         )}
// //       </div>

// //       <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
// //         {navSections.map((section) => (
// //           <div key={section.title} className="mb-4">
// //             {(!collapsed || isMobile) && (
// //               <p className="px-3 pb-2 pt-3 text-right text-[11px] font-semibold tracking-wider text-sidebar-muted">
// //                 {section.title}
// //               </p>
// //             )}

// //             <ul className="space-y-0.5">
// //               {section.items.map((item) => {
// //                 const hasSubmenu = !!item.submenu?.length;
// //                 const isChildActive =
// //                   hasSubmenu && item.submenu!.some((sub) => sub.href === pathname);
// //                 const active = pathname === item.href || isChildActive;
// //                 const isOpen = openItems.includes(item.href);
// //                 const isFlyoutOpen =
// //                   collapsed && !isMobile && flyoutHref === item.href;
// //                 const Icon = item.icon;

// //                 // حالت collapsed روی دسکتاپ: از flyout استفاده کن
// //                 const showFlyout = collapsed && !isMobile && hasSubmenu;

// //                 return (
// //                   <li
// //                     key={item.href}
// //                     className="relative"
// //                     onMouseEnter={
// //                       showFlyout ? () => handleMouseEnter(item.href) : undefined
// //                     }
// //                     onMouseLeave={showFlyout ? handleMouseLeave : undefined}
// //                   >
// //                     {hasSubmenu ? (
// //                       <Collapsible.Root
// //                         open={showFlyout ? false : isOpen}
// //                         onOpenChange={() => !showFlyout && toggleItem(item.href)}
// //                       >
// //                         <Collapsible.Trigger asChild>
// //                           <button
// //                             title={collapsed && !isMobile ? item.label : undefined}
// //                             className={cn(
// //                               "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
// //                               active
// //                                 ? "bg-sidebar-active-bg text-sidebar-active-fg"
// //                                 : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
// //                               collapsed && !isMobile && "justify-center px-0"
// //                             )}
// //                           >
// //                             <Icon
// //                               className={cn(
// //                                 "h-[18px] w-[18px] shrink-0",
// //                                 active
// //                                   ? "text-sidebar-active-fg"
// //                                   : "text-sidebar-foreground/60 group-hover:text-white"
// //                               )}
// //                             />

// //                             {(!collapsed || isMobile) && (
// //                               <>
// //                                 <span className="flex-1 truncate text-right">
// //                                   {item.label}
// //                                 </span>

// //                                 {item.badge && (
// //                                   <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
// //                                     {item.badge}
// //                                   </span>
// //                                 )}

// //                                 <ChevronDown
// //                                   className={cn(
// //                                     "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform duration-200",
// //                                     isOpen && "rotate-180"
// //                                   )}
// //                                 />
// //                               </>
// //                             )}
// //                           </button>
// //                         </Collapsible.Trigger>

// //                         {/* زیرمنوی معمولی (حالت باز سایدبار) با انیمیشن Radix */}
// //                         {!showFlyout && (
// //                           <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
// //                             <ul className="mt-0.5">
// //                               {item.submenu!.map((sub) => {
// //                                 const subActive = pathname === sub.href;
// //                                 return (
// //                                   <li key={sub.href}>
// //                                     <Link
// //                                       href={sub.href}
// //                                       onClick={isMobile ? onMobileClose : undefined}
// //                                       className={cn(
// //                                         "flex items-center gap-3 rounded-lg py-1.5 pr-9 pl-3 text-[13px] font-medium transition-colors",
// //                                         subActive
// //                                           ? "text-sidebar-active-fg"
// //                                           : "text-sidebar-foreground/60 hover:text-white"
// //                                       )}
// //                                     >
// //                                       <span
// //                                         className={cn(
// //                                           "h-1 w-1 shrink-0 rounded-full",
// //                                           subActive
// //                                             ? "bg-sidebar-active-fg"
// //                                             : "bg-sidebar-foreground/40"
// //                                         )}
// //                                       />
// //                                       <span className="flex-1 truncate text-right">
// //                                         {sub.label}
// //                                       </span>
// //                                       {sub.badge && (
// //                                         <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
// //                                           {sub.badge}
// //                                         </span>
// //                                       )}
// //                                     </Link>
// //                                   </li>
// //                                 );
// //                               })}
// //                             </ul>
// //                           </Collapsible.Content>
// //                         )}
// //                       </Collapsible.Root>
// //                     ) : (
// //                       <Link
// //                         href={item.href}
// //                         onClick={isMobile ? onMobileClose : undefined}
// //                         title={collapsed && !isMobile ? item.label : undefined}
// //                         className={cn(
// //                           "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
// //                           active
// //                             ? "bg-sidebar-active-bg text-sidebar-active-fg"
// //                             : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
// //                           collapsed && !isMobile && "justify-center px-0"
// //                         )}
// //                       >
// //                         <Icon
// //                           className={cn(
// //                             "h-[18px] w-[18px] shrink-0",
// //                             active
// //                               ? "text-sidebar-active-fg"
// //                               : "text-sidebar-foreground/60 group-hover:text-white"
// //                           )}
// //                         />

// //                         {(!collapsed || isMobile) && (
// //                           <span className="flex-1 truncate text-right">
// //                             {item.label}
// //                           </span>
// //                         )}

// //                         {(!collapsed || isMobile) && item.badge && (
// //                           <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
// //                             {item.badge}
// //                           </span>
// //                         )}
// //                       </Link>
// //                     )}

// //                     {/* Flyout: زیرمنو کنار سایدبار در حالت collapsed */}
// //                     {showFlyout && (
// //                       <div
// //                         className={cn(
// //                           "absolute right-full top-0 z-50 mr-2 min-w-[200px] origin-top-right rounded-lg border border-sidebar-border bg-sidebar p-1.5 shadow-xl transition-all duration-150",
// //                           isFlyoutOpen
// //                             ? "pointer-events-auto translate-x-0 opacity-100"
// //                             : "pointer-events-none translate-x-2 opacity-0"
// //                         )}
// //                       >
// //                         <p className="truncate px-2.5 pb-1.5 pt-1 text-[12px] font-semibold text-white">
// //                           {item.label}
// //                         </p>
// //                         <ul className="space-y-0.5">
// //                           {item.submenu!.map((sub) => {
// //                             const subActive = pathname === sub.href;
// //                             return (
// //                               <li key={sub.href}>
// //                                 <Link
// //                                   href={sub.href}
// //                                   className={cn(
// //                                     "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
// //                                     subActive
// //                                       ? "bg-sidebar-active-bg text-sidebar-active-fg"
// //                                       : "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-white"
// //                                   )}
// //                                 >
// //                                   <span
// //                                     className={cn(
// //                                       "h-1 w-1 shrink-0 rounded-full",
// //                                       subActive
// //                                         ? "bg-sidebar-active-fg"
// //                                         : "bg-sidebar-foreground/40"
// //                                     )}
// //                                   />
// //                                   <span className="flex-1 truncate text-right">
// //                                     {sub.label}
// //                                   </span>
// //                                   {sub.badge && (
// //                                     <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
// //                                       {sub.badge}
// //                                     </span>
// //                                   )}
// //                                 </Link>
// //                               </li>
// //                             );
// //                           })}
// //                         </ul>
// //                       </div>
// //                     )}
// //                   </li>
// //                 );
// //               })}
// //             </ul>
// //           </div>
// //         ))}
// //       </nav>

// //       {/* User */}
// //       <div className="shrink-0 border-t border-sidebar-border p-3">
// //         <div
// //           className={cn(
// //             "flex items-center gap-3 rounded-lg p-2",
// //             collapsed && !isMobile && "justify-center"
// //           )}
// //         >
// //           <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
// //             ن
// //           </div>

// //           {(!collapsed || isMobile) && (
// //             <div className="min-w-0 flex-1 text-right leading-tight">
// //               <p className="truncate text-[13.5px] font-medium text-white">
// //                 Nazir Ahmad
// //               </p>
// //               <p className="truncate text-[11px] text-sidebar-muted">
// //                 مدیر سیستم
// //               </p>
// //             </div>
// //           )}

// //           {(!collapsed || isMobile) && (
// //             <button
// //               className="text-sidebar-muted hover:text-white"
// //               aria-label="Logout"
// //             >
// //               <LogOut size={16} />
// //             </button>
// //           )}
// //         </div>
// //       </div>
// //     </>
// //   );

// //   return (
// //     <>
// //       {/* Desktop */}
// //       <aside
// //         dir="rtl"
// //         className={cn(
// //           "relative hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
// //           collapsed ? "w-[76px]" : "w-64"
// //         )}
// //       >
// //         <button
// //           onClick={onToggle}
// //           className="absolute -left-3 top-[26px] z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md md:flex"
// //         >
// //           <ChevronRight
// //             className={cn(
// //               "h-3.5 w-3.5 transition-transform",
// //               collapsed && "rotate-180"
// //             )}
// //           />
// //         </button>

// //         {content(false)}
// //       </aside>

// //       {/* Mobile */}
// //       <div
// //         className={cn(
// //           "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
// //           mobileOpen ? "pointer-events-auto opacity-1" : "pointer-events-none opacity-0"
// //         )}
// //         onClick={onMobileClose}
// //       />

// //       <aside
// //         dir="rtl"
// //         className={cn(
// //           "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:hidden",
// //           mobileOpen ? "translate-x-0" : "translate-x-full"
// //         )}
// //       >
// //         {content(true)}
// //       </aside>
// //     </>
// //   );
// // }



// "use client";

// import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { ChevronRight, ChevronDown, X, LogOut } from "lucide-react";
// import * as Collapsible from "@radix-ui/react-collapsible";

// import { navSections } from "@/lib/nav-data";
// import { cn } from "@/lib/utils";
// import { LogoMark } from "@/components/icons/logo-mark";

// interface SidebarProps {
//   collapsed: boolean;
//   onToggle: () => void;
//   mobileOpen: boolean;
//   onMobileClose: () => void;
// }

// export function Sidebar({
//   collapsed,
//   onToggle,
//   mobileOpen,
//   onMobileClose,
// }: SidebarProps) {
//   const pathname = usePathname();
//   const [openItems, setOpenItems] = useState<string[]>([]);
//   const [flyoutHref, setFlyoutHref] = useState<string | null>(null);
//   const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // باز کردن خودکار زیرمنویی که آیتم فعال داخل آن است
//   useEffect(() => {
//     const parentToOpen = navSections
//       .flatMap((section) => section.items)
//       .find((item) => item.submenu?.some((sub) => sub.href === pathname));

//     if (parentToOpen && !openItems.includes(parentToOpen.href)) {
//       setOpenItems((prev) => [...prev, parentToOpen.href]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pathname]);

//   const toggleItem = (href: string) => {
//     setOpenItems((prev) =>
//       prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
//     );
//   };

//   // مدیریت hover برای flyout (با تاخیر کوچک تا لرزش نکنه)
//   const handleMouseEnter = (href: string) => {
//     if (closeTimer.current) clearTimeout(closeTimer.current);
//     setFlyoutHref(href);
//   };

//   const handleMouseLeave = () => {
//     closeTimer.current = setTimeout(() => setFlyoutHref(null), 150);
//   };

//   const content = (isMobile: boolean) => (
//     <>
//       {/* Brand */}
//       <div className="flex h-24 shrink-0 items-center gap-2.5 px-5 border-b mb-1">
//         <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary h-8 w-8">
//           <LogoMark className="h-[18px] w-[18px] text-white" />
//         </div>

//         {(!collapsed || isMobile) && (
//           <div className="leading-tight">
//             <h1 className="font-brand text-lg font-bold text-white">
//               کرایه‌بان
//             </h1>
//             <p className="text-[12px] tracking-wider text-sidebar-muted mt-1 text-left">
//               داشبورد مدیریت مارکت
//             </p>
//           </div>
//         )}

//         {isMobile && (
//           <button
//             onClick={onMobileClose}
//             className="mr-auto flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/[0.06] hover:text-white"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         )}
//       </div>

//       <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
//         {navSections.map((section) => (
//           <div key={section.title} className="mb-4">
//             {(!collapsed || isMobile) && (
//               <p className="px-3 pb-2 pt-3 text-right text-[11px] font-semibold tracking-wider text-sidebar-muted">
//                 {section.title}
//               </p>
//             )}

//             <ul className="space-y-0.5">
//               {section.items.map((item) => {
//                 const hasSubmenu = !!item.submenu?.length;
//                 const isChildActive =
//                   hasSubmenu && item.submenu!.some((sub) => sub.href === pathname);
//                 const active = pathname === item.href || isChildActive;
//                 const isOpen = openItems.includes(item.href);
//                 const isFlyoutOpen =
//                   collapsed && !isMobile && flyoutHref === item.href;
//                 const Icon = item.icon;

//                 // حالت collapsed روی دسکتاپ: از flyout استفاده کن
//                 const showFlyout = collapsed && !isMobile && hasSubmenu;

//                 return (
//                   <li
//                     key={item.href}
//                     className="relative"
//                     onMouseEnter={
//                       showFlyout ? () => handleMouseEnter(item.href) : undefined
//                     }
//                     onMouseLeave={showFlyout ? handleMouseLeave : undefined}
//                   >
//                     {hasSubmenu ? (
//                       <Collapsible.Root
//                         open={showFlyout ? false : isOpen}
//                         onOpenChange={() => !showFlyout && toggleItem(item.href)}
//                       >
//                         <Collapsible.Trigger asChild>
//                           <button
//                             title={collapsed && !isMobile ? item.label : undefined}
//                             className={cn(
//                               "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
//                               active
//                                 ? "bg-sidebar-active-bg text-sidebar-active-fg"
//                                 : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
//                               collapsed && !isMobile && "justify-center px-0"
//                             )}
//                           >
//                             <Icon
//                               className={cn(
//                                 "h-[18px] w-[18px] shrink-0",
//                                 active
//                                   ? "text-sidebar-active-fg"
//                                   : "text-sidebar-foreground/60 group-hover:text-white"
//                               )}
//                             />

//                             {(!collapsed || isMobile) && (
//                               <>
//                                 <span className="flex-1 truncate text-right">
//                                   {item.label}
//                                 </span>

//                                 {item.badge && (
//                                   <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
//                                     {item.badge}
//                                   </span>
//                                 )}

//                                 <ChevronDown
//                                   className={cn(
//                                     "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform duration-200",
//                                     isOpen && "rotate-180"
//                                   )}
//                                 />
//                               </>
//                             )}
//                           </button>
//                         </Collapsible.Trigger>

//                         {/* زیرمنوی معمولی (حالت باز سایدبار) با انیمیشن Radix */}
//                         {!showFlyout && (
//                           <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
//                             <ul className="mt-0.5">
//                               {item.submenu!.map((sub) => {
//                                 const subActive = pathname === sub.href;
//                                 return (
//                                   <li key={sub.href}>
//                                     <Link
//                                       href={sub.href}
//                                       onClick={isMobile ? onMobileClose : undefined}
//                                       className={cn(
//                                         "flex items-center gap-3 rounded-lg py-1.5 pr-9 pl-3 text-[13px] font-medium transition-colors",
//                                         subActive
//                                           ? "text-sidebar-active-fg"
//                                           : "text-sidebar-foreground/60 hover:text-white"
//                                       )}
//                                     >
//                                       <span
//                                         className={cn(
//                                           "h-1 w-1 shrink-0 rounded-full",
//                                           subActive
//                                             ? "bg-sidebar-active-fg"
//                                             : "bg-sidebar-foreground/40"
//                                         )}
//                                       />
//                                       <span className="flex-1 truncate text-right">
//                                         {sub.label}
//                                       </span>
//                                       {sub.badge && (
//                                         <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
//                                           {sub.badge}
//                                         </span>
//                                       )}
//                                     </Link>
//                                   </li>
//                                 );
//                               })}
//                             </ul>
//                           </Collapsible.Content>
//                         )}
//                       </Collapsible.Root>
//                     ) : (
//                       <Link
//                         href={item.href}
//                         onClick={isMobile ? onMobileClose : undefined}
//                         title={collapsed && !isMobile ? item.label : undefined}
//                         className={cn(
//                           "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
//                           active
//                             ? "bg-sidebar-active-bg text-sidebar-active-fg"
//                             : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
//                           collapsed && !isMobile && "justify-center px-0"
//                         )}
//                       >
//                         <Icon
//                           className={cn(
//                             "h-[18px] w-[18px] shrink-0",
//                             active
//                               ? "text-sidebar-active-fg"
//                               : "text-sidebar-foreground/60 group-hover:text-white"
//                           )}
//                         />

//                         {(!collapsed || isMobile) && (
//                           <span className="flex-1 truncate text-right">
//                             {item.label}
//                           </span>
//                         )}

//                         {(!collapsed || isMobile) && item.badge && (
//                           <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
//                             {item.badge}
//                           </span>
//                         )}
//                       </Link>
//                     )}

//                     {/* Flyout: زیرمنو کنار سایدبار در حالت collapsed */}
//                     {showFlyout && (
//                       <div
//                         className={cn(
//                           "absolute right-full top-0 z-50 mr-2 min-w-[200px] origin-top-right rounded-lg border border-sidebar-border bg-sidebar p-1.5 shadow-xl transition-all duration-150",
//                           isFlyoutOpen
//                             ? "pointer-events-auto translate-x-0 opacity-100"
//                             : "pointer-events-none translate-x-2 opacity-0"
//                         )}
//                       >
//                         <p className="truncate px-2.5 pb-1.5 pt-1 text-[12px] font-semibold text-white">
//                           {item.label}
//                         </p>
//                         <ul className="space-y-0.5">
//                           {item.submenu!.map((sub) => {
//                             const subActive = pathname === sub.href;
//                             return (
//                               <li key={sub.href}>
//                                 <Link
//                                   href={sub.href}
//                                   className={cn(
//                                     "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
//                                     subActive
//                                       ? "bg-sidebar-active-bg text-sidebar-active-fg"
//                                       : "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-white"
//                                   )}
//                                 >
//                                   <span
//                                     className={cn(
//                                       "h-1 w-1 shrink-0 rounded-full",
//                                       subActive
//                                         ? "bg-sidebar-active-fg"
//                                         : "bg-sidebar-foreground/40"
//                                     )}
//                                   />
//                                   <span className="flex-1 truncate text-right">
//                                     {sub.label}
//                                   </span>
//                                   {sub.badge && (
//                                     <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
//                                       {sub.badge}
//                                     </span>
//                                   )}
//                                 </Link>
//                               </li>
//                             );
//                           })}
//                         </ul>
//                       </div>
//                     )}
//                   </li>
//                 );
//               })}
//             </ul>
//           </div>
//         ))}
//       </nav>

//       {/* User */}
//       <div className="shrink-0 border-t border-sidebar-border p-3">
//         <div
//           className={cn(
//             "flex items-center gap-3 rounded-lg p-2",
//             collapsed && !isMobile && "justify-center"
//           )}
//         >
//           <Link
//             href="/profile"
//             className={cn(
//               "flex min-w-0 flex-1 items-center gap-3 rounded-md",
//               collapsed && !isMobile && "justify-center"
//             )}
//           >
//             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
//               ن
//             </div>

//             {(!collapsed || isMobile) && (
//               <div className="min-w-0 flex-1 text-right leading-tight">
//                 <p className="truncate text-[13.5px] font-medium text-white">
//                   Nazir Ahmad
//                 </p>
//                 <p className="truncate text-[11px] text-sidebar-muted">
//                   مدیر سیستم
//                 </p>
//               </div>
//             )}
//           </Link>

//           {(!collapsed || isMobile) && (
//             <button
//               className="text-sidebar-muted hover:text-white"
//               aria-label="Logout"
//             >
//               <LogOut size={16} />
//             </button>
//           )}
//         </div>
//       </div>
//     </>
//   );

//   return (
//     <>
//       {/* Desktop */}
//       <aside
//         dir="rtl"
//         className={cn(
//           "relative hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
//           collapsed ? "w-[76px]" : "w-64"
//         )}
//       >
//         <button
//           onClick={onToggle}
//           className="absolute -left-3 top-[26px] z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md md:flex"
//         >
//           <ChevronRight
//             className={cn(
//               "h-3.5 w-3.5 transition-transform",
//               collapsed && "rotate-180"
//             )}
//           />
//         </button>

//         {content(false)}
//       </aside>

//       {/* Mobile */}
//       <div
//         className={cn(
//           "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
//           mobileOpen ? "pointer-events-auto opacity-1" : "pointer-events-none opacity-0"
//         )}
//         onClick={onMobileClose}
//       />

//       <aside
//         dir="rtl"
//         className={cn(
//           "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:hidden",
//           mobileOpen ? "translate-x-0" : "translate-x-full"
//         )}
//       >
//         {content(true)}
//       </aside>
//     </>
//   );
// }





"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, X, LogOut } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";

import { navSections } from "@/lib/client/nav-data";
import { cn } from "@/lib/shared/utils";
import { LogoMark } from "@/components/server/icons/logo-mark";
import { useAuth } from "@/contexts/auth-context";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [flyoutHref, setFlyoutHref] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // باز کردن خودکار زیرمنویی که آیتم فعال داخل آن است
  useEffect(() => {
    const parentToOpen = navSections
      .flatMap((section) => section.items)
      .find((item) => item.submenu?.some((sub) => sub.href === pathname));

    if (parentToOpen && !openItems.includes(parentToOpen.href)) {
      setOpenItems((prev) => [...prev, parentToOpen.href]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleItem = (href: string) => {
    setOpenItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  // مدیریت hover برای flyout (با تاخیر کوچک تا لرزش نکنه)
  const handleMouseEnter = (href: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutHref(href);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setFlyoutHref(null), 150);
  };

  const content = (isMobile: boolean) => (
    <>
      {/* Brand */}
      <div className="flex h-24 shrink-0 items-center gap-2.5 px-5 border-b mb-1">
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary h-8 w-8">
          <LogoMark className="h-[18px] w-[18px] text-white" />
        </div>

        {(!collapsed || isMobile) && (
          <div className="leading-tight">
            <h1 className="font-brand text-lg font-bold text-white">
              کرایه‌بان
            </h1>
            <p className="text-[12px] tracking-wider text-sidebar-muted mt-1 text-left">
              داشبورد مدیریت مارکت
            </p>
          </div>
        )}

        {isMobile && (
          <button
            onClick={onMobileClose}
            className="mr-auto flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {(!collapsed || isMobile) && (
              <p className="px-3 pb-2 pt-3 text-right text-[11px] font-semibold tracking-wider text-sidebar-muted">
                {section.title}
              </p>
            )}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const hasSubmenu = !!item.submenu?.length;
                const isChildActive =
                  hasSubmenu && item.submenu!.some((sub) => sub.href === pathname);
                const active = pathname === item.href || isChildActive;
                const isOpen = openItems.includes(item.href);
                const isFlyoutOpen =
                  collapsed && !isMobile && flyoutHref === item.href;
                const Icon = item.icon;

                // حالت collapsed روی دسکتاپ: از flyout استفاده کن
                const showFlyout = collapsed && !isMobile && hasSubmenu;

                return (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={
                      showFlyout ? () => handleMouseEnter(item.href) : undefined
                    }
                    onMouseLeave={showFlyout ? handleMouseLeave : undefined}
                  >
                    {hasSubmenu ? (
                      <Collapsible.Root
                        open={showFlyout ? false : isOpen}
                        onOpenChange={() => !showFlyout && toggleItem(item.href)}
                      >
                        <Collapsible.Trigger asChild>
                          <button
                            title={collapsed && !isMobile ? item.label : undefined}
                            className={cn(
                              "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                              active
                                ? "bg-sidebar-active-bg text-sidebar-active-fg"
                                : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
                              collapsed && !isMobile && "justify-center px-0"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-[18px] w-[18px] shrink-0",
                                active
                                  ? "text-sidebar-active-fg"
                                  : "text-sidebar-foreground/60 group-hover:text-white"
                              )}
                            />

                            {(!collapsed || isMobile) && (
                              <>
                                <span className="flex-1 truncate text-right">
                                  {item.label}
                                </span>

                                {item.badge && (
                                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                                    {item.badge}
                                  </span>
                                )}

                                <ChevronDown
                                  className={cn(
                                    "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform duration-200",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </>
                            )}
                          </button>
                        </Collapsible.Trigger>

                        {/* زیرمنوی معمولی (حالت باز سایدبار) با انیمیشن Radix */}
                        {!showFlyout && (
                          <Collapsible.Content className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                            <ul className="mt-0.5">
                              {item.submenu!.map((sub) => {
                                const subActive = pathname === sub.href;
                                return (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      onClick={isMobile ? onMobileClose : undefined}
                                      className={cn(
                                        "flex items-center gap-3 rounded-lg py-1.5 pr-9 pl-3 text-[13px] font-medium transition-colors",
                                        subActive
                                          ? "text-sidebar-active-fg"
                                          : "text-sidebar-foreground/60 hover:text-white"
                                      )}
                                    >
                                      <span
                                        className={cn(
                                          "h-1 w-1 shrink-0 rounded-full",
                                          subActive
                                            ? "bg-sidebar-active-fg"
                                            : "bg-sidebar-foreground/40"
                                        )}
                                      />
                                      <span className="flex-1 truncate text-right">
                                        {sub.label}
                                      </span>
                                      {sub.badge && (
                                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                          {sub.badge}
                                        </span>
                                      )}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </Collapsible.Content>
                        )}
                      </Collapsible.Root>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={isMobile ? onMobileClose : undefined}
                        title={collapsed && !isMobile ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                          active
                            ? "bg-sidebar-active-bg text-sidebar-active-fg"
                            : "text-sidebar-foreground/80 hover:bg-white/[0.04] hover:text-white",
                          collapsed && !isMobile && "justify-center px-0"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            active
                              ? "text-sidebar-active-fg"
                              : "text-sidebar-foreground/60 group-hover:text-white"
                          )}
                        />

                        {(!collapsed || isMobile) && (
                          <span className="flex-1 truncate text-right">
                            {item.label}
                          </span>
                        )}

                        {(!collapsed || isMobile) && item.badge && (
                          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}

                    {/* Flyout: زیرمنو کنار سایدبار در حالت collapsed */}
                    {showFlyout && (
                      <div
                        className={cn(
                          "absolute right-full top-0 z-50 mr-2 min-w-[200px] origin-top-right rounded-lg border border-sidebar-border bg-sidebar p-1.5 shadow-xl transition-all duration-150",
                          isFlyoutOpen
                            ? "pointer-events-auto translate-x-0 opacity-100"
                            : "pointer-events-none translate-x-2 opacity-0"
                        )}
                      >
                        <p className="truncate px-2.5 pb-1.5 pt-1 text-[12px] font-semibold text-white">
                          {item.label}
                        </p>
                        <ul className="space-y-0.5">
                          {item.submenu!.map((sub) => {
                            const subActive = pathname === sub.href;
                            return (
                              <li key={sub.href}>
                                <Link
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                                    subActive
                                      ? "bg-sidebar-active-bg text-sidebar-active-fg"
                                      : "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-white"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1 w-1 shrink-0 rounded-full",
                                      subActive
                                        ? "bg-sidebar-active-fg"
                                        : "bg-sidebar-foreground/40"
                                    )}
                                  />
                                  <span className="flex-1 truncate text-right">
                                    {sub.label}
                                  </span>
                                  {sub.badge && (
                                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                      {sub.badge}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2",
            collapsed && !isMobile && "justify-center"
          )}
        >
          <Link
            href="/profile"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-md",
              collapsed && !isMobile && "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {user ? user.firstName.charAt(0) : "؟"}
            </div>

            {(!collapsed || isMobile) && (
              <div className="min-w-0 flex-1 text-right leading-tight">
                <p className="truncate text-[13.5px] font-medium text-white">
                  {user ? `${user.firstName} ${user.lastName}` : "در حال بارگذاری..."}
                </p>
                <p className="truncate text-[11px] text-sidebar-muted">
                  {user?.role ?? ""}
                </p>
              </div>
            )}
          </Link>

          {(!collapsed || isMobile) && (
            <button
              onClick={() => logout()}
              className="text-sidebar-muted hover:text-white"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        dir="rtl"
        className={cn(
          "relative hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <button
          onClick={onToggle}
          className="absolute -left-3 top-[26px] z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md md:flex"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>

        {content(false)}
      </aside>

      {/* Mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          mobileOpen ? "pointer-events-auto opacity-1" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
      />

      <aside
        dir="rtl"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {content(true)}
      </aside>
    </>
  );
}
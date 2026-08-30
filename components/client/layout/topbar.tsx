"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Moon,
  Palette,
  Bell,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "../ModeToggle";
import Link from 'next/link'

export function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);


  if (mobileSearchOpen) {
    return (
      <header
        dir="rtl"
        className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-card px-4 md:hidden"
      >

        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />

        <input
          autoFocus
          type="text"
          placeholder="جستجو کنید..."
          className="
            h-9
            flex-1
            bg-transparent
            text-sm
            text-right
            outline-none
            placeholder:text-muted-foreground
          "
        />


        <button
          onClick={() => setMobileSearchOpen(false)}
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-muted-foreground
            hover:bg-secondary
          "
        >
          <X className="h-[18px] w-[18px]" />
        </button>

      </header>
    );
  }



  return (
    <header
      dir="rtl"
      className="
        sticky
        top-0
        z-20
        flex
        h-16
        items-center
        gap-3
        border-b
        border-border
        bg-card/80
        px-4
        backdrop-blur
        md:gap-4
        md:px-6
      "
    >


      {/* Mobile Menu */}
      <button
        onClick={onMenuClick}
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          text-foreground
          hover:bg-secondary
          md:hidden
        "
      >
        <Menu className="h-5 w-5" />
      </button>



      {/* Search */}
      <div className="
        relative
        hidden
        max-w-sm
        flex-1
        md:block
      ">

        <Search
          className="
            pointer-events-none
            absolute
            right-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "
        />


        <input
          type="text"
          placeholder="جستجو کنید..."
          className="
            h-9
            w-full
            rounded-lg
            border
            border-input
            bg-background
            pr-9
            pl-14
            text-right
            text-sm
            outline-none
            placeholder:text-muted-foreground
            focus:ring-2
            focus:ring-ring/40
          "
        />


        <kbd
          className="
            pointer-events-none
            absolute
            left-2.5
            top-1/2
            -translate-y-1/2
            rounded
            border
            border-border
            bg-secondary
            px-1.5
            py-0.5
            text-[10px]
            font-medium
            text-muted-foreground
          "
        >
          ⌘K
        </kbd>

      </div>



      {/* Mobile Search */}
      <button
        onClick={() => setMobileSearchOpen(true)}
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          text-muted-foreground
          hover:bg-secondary
          md:hidden
        "
      >
        <Search className="h-[18px] w-[18px]" />
      </button>




      {/* Actions */}
      <div
        className="
          mr-auto
          flex
          items-center
          gap-2
          md:gap-2.5
        "
      >


        {/* <Button
          size="sm"
          className="gap-1.5 px-3 md:px-4"
        >
          <Plus className="h-4 w-4" />

          <span className="hidden sm:inline">
            سفارش جدید
          </span>

        </Button> */}



        <div
          className="
            mx-1
            hidden
            items-center
            gap-1
            text-muted-foreground
            lg:flex
          "
        >

         <ModeToggle />


          {/* <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
          >
            <Palette className="h-[18px] w-[18px]" />
          </Button> */}



          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9"
          >

            <Bell className="h-[18px] w-[18px]" />

            <span
              className="
                absolute
                left-2
                top-2
                h-1.5
                w-1.5
                rounded-full
                bg-rose-500
              "
            />

          </Button>


        </div>



        <Link href="/market-profile">  
        <Avatar className="h-8 w-8">
          <AvatarFallback>
          Ah
          </AvatarFallback>

        </Avatar>

</Link>
      </div>


    </header>
  );
}
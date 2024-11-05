"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, User, LogOut, Settings, BabyIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Hexagon } from "lucide-react"

export default function Navbar({ className }: React.HTMLAttributes<HTMLElement>) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-1",
        "bg-opacity-10 bg-gray-100 backdrop-blur-xl shadow-sm m-4 rounded-xl",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center justify-center">
            <Hexagon /> 
            <p className="mx-2">Movie AI</p>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon" className="">
            <User />
            <span className="sr-only">Toggle menu</span>
        </Button>
        <Button variant="ghost" size="icon" className="">
            <Menu />
            <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
    </nav>
  )
}

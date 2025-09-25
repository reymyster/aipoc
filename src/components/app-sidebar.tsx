import { HomeIcon } from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Tooling Tests",
      items: [
        {
          title: "Suspense",
          url: "/tooling/suspense",
          isActive: false,
        },
        {
          title: "Effect AI",
          url: "/tooling/ai",
        },
        {
          title: "Tanstack Query",
          url: "/tooling/tanstack-query",
        },
      ],
    },
    {
      title: "AI Tests",
      items: [
        {
          title: "Fuzzy Search",
          url: "/test/quick-search",
          isActive: false,
        },
        {
          title: "Date Ranges",
          url: "/test/date-range",
          isActive: false,
        },
        {
          title: "Diff Summary",
          url: "/test/diff-summary",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <HomeIcon />
                AI PoCs
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title} className="ml-3">
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <Link href={item.url}>{item.title}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

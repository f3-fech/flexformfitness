/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user?: {
      uid: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    } | null;
  }
}
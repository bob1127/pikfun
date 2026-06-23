import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import { SupabaseS3FileService } from "./service";

export default ModuleProvider(Modules.FILE, {
  services: [SupabaseS3FileService],
});

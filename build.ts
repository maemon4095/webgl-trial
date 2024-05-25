import { serve } from "https://raw.githubusercontent.com/maemon4095/easyserve.ts/main/mod.ts";
import loaderOverridePlugin from "https://raw.githubusercontent.com/maemon4095/deno-esbuilder/main/plugins/loaderOverride/mod.ts";

await serve(
    import.meta.dirname + "/src/index.tsx",
    {
        "outdir": "./dist",
        "denoConfigPath": import.meta.dirname + "/deno.json",
        plugins: [
            loaderOverridePlugin({
                "loader": {
                    ".glsl": "text",
                    ".png": "file",
                },
                "importMap": import.meta.dirname + "/deno.json"
            })
        ]
    }
);
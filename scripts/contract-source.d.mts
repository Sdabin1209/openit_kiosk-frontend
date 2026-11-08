export function pinnedTag(): string;
export function contractFile(path: string): string;
export function contractJson(path: string): any;
export function contractList(dir: string): string[];
export function contractVersion(): string;
export const SURVEY_SCHEMA_TAG: string;
export function surveySchemaJson(name: string): any;

export function surveySchemaNames(): string[];
export function contractUri(): string;
export function registerContractSchemas(ajv: { addSchema(schema: unknown, key?: string): unknown }, transform?: (schema: any) => any): void;

import {envSchema} from './env.schema';

export default () => envSchema.parse(process.env);

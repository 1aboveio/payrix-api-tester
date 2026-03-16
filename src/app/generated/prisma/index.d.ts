
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ApiCall
 * 
 */
export type ApiCall = $Result.DefaultSelection<Prisma.$ApiCallPayload>
/**
 * Model TransactionResponse
 * 
 */
export type TransactionResponse = $Result.DefaultSelection<Prisma.$TransactionResponsePayload>
/**
 * Model WebhookEvent
 * 
 */
export type WebhookEvent = $Result.DefaultSelection<Prisma.$WebhookEventPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more ApiCalls
 * const apiCalls = await prisma.apiCall.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more ApiCalls
   * const apiCalls = await prisma.apiCall.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.apiCall`: Exposes CRUD operations for the **ApiCall** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ApiCalls
    * const apiCalls = await prisma.apiCall.findMany()
    * ```
    */
  get apiCall(): Prisma.ApiCallDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.transactionResponse`: Exposes CRUD operations for the **TransactionResponse** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TransactionResponses
    * const transactionResponses = await prisma.transactionResponse.findMany()
    * ```
    */
  get transactionResponse(): Prisma.TransactionResponseDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.webhookEvent`: Exposes CRUD operations for the **WebhookEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebhookEvents
    * const webhookEvents = await prisma.webhookEvent.findMany()
    * ```
    */
  get webhookEvent(): Prisma.WebhookEventDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.5.0
   * Query Engine version: 280c870be64f457428992c43c1f6d557fab6e29e
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ApiCall: 'ApiCall',
    TransactionResponse: 'TransactionResponse',
    WebhookEvent: 'WebhookEvent'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "apiCall" | "transactionResponse" | "webhookEvent"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ApiCall: {
        payload: Prisma.$ApiCallPayload<ExtArgs>
        fields: Prisma.ApiCallFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ApiCallFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ApiCallFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          findFirst: {
            args: Prisma.ApiCallFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ApiCallFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          findMany: {
            args: Prisma.ApiCallFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>[]
          }
          create: {
            args: Prisma.ApiCallCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          createMany: {
            args: Prisma.ApiCallCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ApiCallCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>[]
          }
          delete: {
            args: Prisma.ApiCallDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          update: {
            args: Prisma.ApiCallUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          deleteMany: {
            args: Prisma.ApiCallDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ApiCallUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ApiCallUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>[]
          }
          upsert: {
            args: Prisma.ApiCallUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ApiCallPayload>
          }
          aggregate: {
            args: Prisma.ApiCallAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateApiCall>
          }
          groupBy: {
            args: Prisma.ApiCallGroupByArgs<ExtArgs>
            result: $Utils.Optional<ApiCallGroupByOutputType>[]
          }
          count: {
            args: Prisma.ApiCallCountArgs<ExtArgs>
            result: $Utils.Optional<ApiCallCountAggregateOutputType> | number
          }
        }
      }
      TransactionResponse: {
        payload: Prisma.$TransactionResponsePayload<ExtArgs>
        fields: Prisma.TransactionResponseFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionResponseFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionResponseFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          findFirst: {
            args: Prisma.TransactionResponseFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionResponseFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          findMany: {
            args: Prisma.TransactionResponseFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>[]
          }
          create: {
            args: Prisma.TransactionResponseCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          createMany: {
            args: Prisma.TransactionResponseCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionResponseCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>[]
          }
          delete: {
            args: Prisma.TransactionResponseDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          update: {
            args: Prisma.TransactionResponseUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          deleteMany: {
            args: Prisma.TransactionResponseDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionResponseUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TransactionResponseUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>[]
          }
          upsert: {
            args: Prisma.TransactionResponseUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionResponsePayload>
          }
          aggregate: {
            args: Prisma.TransactionResponseAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransactionResponse>
          }
          groupBy: {
            args: Prisma.TransactionResponseGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionResponseGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionResponseCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionResponseCountAggregateOutputType> | number
          }
        }
      }
      WebhookEvent: {
        payload: Prisma.$WebhookEventPayload<ExtArgs>
        fields: Prisma.WebhookEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebhookEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebhookEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findFirst: {
            args: Prisma.WebhookEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebhookEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          findMany: {
            args: Prisma.WebhookEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          create: {
            args: Prisma.WebhookEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          createMany: {
            args: Prisma.WebhookEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebhookEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          delete: {
            args: Prisma.WebhookEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          update: {
            args: Prisma.WebhookEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          deleteMany: {
            args: Prisma.WebhookEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebhookEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WebhookEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>[]
          }
          upsert: {
            args: Prisma.WebhookEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookEventPayload>
          }
          aggregate: {
            args: Prisma.WebhookEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebhookEvent>
          }
          groupBy: {
            args: Prisma.WebhookEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebhookEventCountArgs<ExtArgs>
            result: $Utils.Optional<WebhookEventCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    apiCall?: ApiCallOmit
    transactionResponse?: TransactionResponseOmit
    webhookEvent?: WebhookEventOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model ApiCall
   */

  export type AggregateApiCall = {
    _count: ApiCallCountAggregateOutputType | null
    _avg: ApiCallAvgAggregateOutputType | null
    _sum: ApiCallSumAggregateOutputType | null
    _min: ApiCallMinAggregateOutputType | null
    _max: ApiCallMaxAggregateOutputType | null
  }

  export type ApiCallAvgAggregateOutputType = {
    httpStatus: number | null
    durationMs: number | null
  }

  export type ApiCallSumAggregateOutputType = {
    httpStatus: number | null
    durationMs: number | null
  }

  export type ApiCallMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    endpoint: string | null
    method: string | null
    source: string | null
    templateName: string | null
    transactionId: string | null
    referenceNumber: string | null
    httpStatus: number | null
    httpStatusText: string | null
    durationMs: number | null
  }

  export type ApiCallMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    endpoint: string | null
    method: string | null
    source: string | null
    templateName: string | null
    transactionId: string | null
    referenceNumber: string | null
    httpStatus: number | null
    httpStatusText: string | null
    durationMs: number | null
  }

  export type ApiCallCountAggregateOutputType = {
    id: number
    createdAt: number
    endpoint: number
    method: number
    source: number
    templateName: number
    transactionId: number
    referenceNumber: number
    requestHeaders: number
    requestBody: number
    responseBody: number
    httpStatus: number
    httpStatusText: number
    durationMs: number
    _all: number
  }


  export type ApiCallAvgAggregateInputType = {
    httpStatus?: true
    durationMs?: true
  }

  export type ApiCallSumAggregateInputType = {
    httpStatus?: true
    durationMs?: true
  }

  export type ApiCallMinAggregateInputType = {
    id?: true
    createdAt?: true
    endpoint?: true
    method?: true
    source?: true
    templateName?: true
    transactionId?: true
    referenceNumber?: true
    httpStatus?: true
    httpStatusText?: true
    durationMs?: true
  }

  export type ApiCallMaxAggregateInputType = {
    id?: true
    createdAt?: true
    endpoint?: true
    method?: true
    source?: true
    templateName?: true
    transactionId?: true
    referenceNumber?: true
    httpStatus?: true
    httpStatusText?: true
    durationMs?: true
  }

  export type ApiCallCountAggregateInputType = {
    id?: true
    createdAt?: true
    endpoint?: true
    method?: true
    source?: true
    templateName?: true
    transactionId?: true
    referenceNumber?: true
    requestHeaders?: true
    requestBody?: true
    responseBody?: true
    httpStatus?: true
    httpStatusText?: true
    durationMs?: true
    _all?: true
  }

  export type ApiCallAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiCall to aggregate.
     */
    where?: ApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiCalls to fetch.
     */
    orderBy?: ApiCallOrderByWithRelationInput | ApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ApiCalls
    **/
    _count?: true | ApiCallCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ApiCallAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ApiCallSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ApiCallMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ApiCallMaxAggregateInputType
  }

  export type GetApiCallAggregateType<T extends ApiCallAggregateArgs> = {
        [P in keyof T & keyof AggregateApiCall]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateApiCall[P]>
      : GetScalarType<T[P], AggregateApiCall[P]>
  }




  export type ApiCallGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ApiCallWhereInput
    orderBy?: ApiCallOrderByWithAggregationInput | ApiCallOrderByWithAggregationInput[]
    by: ApiCallScalarFieldEnum[] | ApiCallScalarFieldEnum
    having?: ApiCallScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ApiCallCountAggregateInputType | true
    _avg?: ApiCallAvgAggregateInputType
    _sum?: ApiCallSumAggregateInputType
    _min?: ApiCallMinAggregateInputType
    _max?: ApiCallMaxAggregateInputType
  }

  export type ApiCallGroupByOutputType = {
    id: string
    createdAt: Date
    endpoint: string
    method: string
    source: string
    templateName: string | null
    transactionId: string | null
    referenceNumber: string | null
    requestHeaders: JsonValue
    requestBody: JsonValue | null
    responseBody: JsonValue | null
    httpStatus: number
    httpStatusText: string
    durationMs: number | null
    _count: ApiCallCountAggregateOutputType | null
    _avg: ApiCallAvgAggregateOutputType | null
    _sum: ApiCallSumAggregateOutputType | null
    _min: ApiCallMinAggregateOutputType | null
    _max: ApiCallMaxAggregateOutputType | null
  }

  type GetApiCallGroupByPayload<T extends ApiCallGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ApiCallGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ApiCallGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ApiCallGroupByOutputType[P]>
            : GetScalarType<T[P], ApiCallGroupByOutputType[P]>
        }
      >
    >


  export type ApiCallSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    endpoint?: boolean
    method?: boolean
    source?: boolean
    templateName?: boolean
    transactionId?: boolean
    referenceNumber?: boolean
    requestHeaders?: boolean
    requestBody?: boolean
    responseBody?: boolean
    httpStatus?: boolean
    httpStatusText?: boolean
    durationMs?: boolean
  }, ExtArgs["result"]["apiCall"]>

  export type ApiCallSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    endpoint?: boolean
    method?: boolean
    source?: boolean
    templateName?: boolean
    transactionId?: boolean
    referenceNumber?: boolean
    requestHeaders?: boolean
    requestBody?: boolean
    responseBody?: boolean
    httpStatus?: boolean
    httpStatusText?: boolean
    durationMs?: boolean
  }, ExtArgs["result"]["apiCall"]>

  export type ApiCallSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    endpoint?: boolean
    method?: boolean
    source?: boolean
    templateName?: boolean
    transactionId?: boolean
    referenceNumber?: boolean
    requestHeaders?: boolean
    requestBody?: boolean
    responseBody?: boolean
    httpStatus?: boolean
    httpStatusText?: boolean
    durationMs?: boolean
  }, ExtArgs["result"]["apiCall"]>

  export type ApiCallSelectScalar = {
    id?: boolean
    createdAt?: boolean
    endpoint?: boolean
    method?: boolean
    source?: boolean
    templateName?: boolean
    transactionId?: boolean
    referenceNumber?: boolean
    requestHeaders?: boolean
    requestBody?: boolean
    responseBody?: boolean
    httpStatus?: boolean
    httpStatusText?: boolean
    durationMs?: boolean
  }

  export type ApiCallOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "endpoint" | "method" | "source" | "templateName" | "transactionId" | "referenceNumber" | "requestHeaders" | "requestBody" | "responseBody" | "httpStatus" | "httpStatusText" | "durationMs", ExtArgs["result"]["apiCall"]>

  export type $ApiCallPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ApiCall"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      endpoint: string
      method: string
      source: string
      templateName: string | null
      transactionId: string | null
      referenceNumber: string | null
      requestHeaders: Prisma.JsonValue
      requestBody: Prisma.JsonValue | null
      responseBody: Prisma.JsonValue | null
      httpStatus: number
      httpStatusText: string
      durationMs: number | null
    }, ExtArgs["result"]["apiCall"]>
    composites: {}
  }

  type ApiCallGetPayload<S extends boolean | null | undefined | ApiCallDefaultArgs> = $Result.GetResult<Prisma.$ApiCallPayload, S>

  type ApiCallCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ApiCallFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ApiCallCountAggregateInputType | true
    }

  export interface ApiCallDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ApiCall'], meta: { name: 'ApiCall' } }
    /**
     * Find zero or one ApiCall that matches the filter.
     * @param {ApiCallFindUniqueArgs} args - Arguments to find a ApiCall
     * @example
     * // Get one ApiCall
     * const apiCall = await prisma.apiCall.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ApiCallFindUniqueArgs>(args: SelectSubset<T, ApiCallFindUniqueArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ApiCall that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ApiCallFindUniqueOrThrowArgs} args - Arguments to find a ApiCall
     * @example
     * // Get one ApiCall
     * const apiCall = await prisma.apiCall.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ApiCallFindUniqueOrThrowArgs>(args: SelectSubset<T, ApiCallFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ApiCall that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallFindFirstArgs} args - Arguments to find a ApiCall
     * @example
     * // Get one ApiCall
     * const apiCall = await prisma.apiCall.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ApiCallFindFirstArgs>(args?: SelectSubset<T, ApiCallFindFirstArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ApiCall that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallFindFirstOrThrowArgs} args - Arguments to find a ApiCall
     * @example
     * // Get one ApiCall
     * const apiCall = await prisma.apiCall.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ApiCallFindFirstOrThrowArgs>(args?: SelectSubset<T, ApiCallFindFirstOrThrowArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ApiCalls that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ApiCalls
     * const apiCalls = await prisma.apiCall.findMany()
     * 
     * // Get first 10 ApiCalls
     * const apiCalls = await prisma.apiCall.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const apiCallWithIdOnly = await prisma.apiCall.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ApiCallFindManyArgs>(args?: SelectSubset<T, ApiCallFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ApiCall.
     * @param {ApiCallCreateArgs} args - Arguments to create a ApiCall.
     * @example
     * // Create one ApiCall
     * const ApiCall = await prisma.apiCall.create({
     *   data: {
     *     // ... data to create a ApiCall
     *   }
     * })
     * 
     */
    create<T extends ApiCallCreateArgs>(args: SelectSubset<T, ApiCallCreateArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ApiCalls.
     * @param {ApiCallCreateManyArgs} args - Arguments to create many ApiCalls.
     * @example
     * // Create many ApiCalls
     * const apiCall = await prisma.apiCall.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ApiCallCreateManyArgs>(args?: SelectSubset<T, ApiCallCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ApiCalls and returns the data saved in the database.
     * @param {ApiCallCreateManyAndReturnArgs} args - Arguments to create many ApiCalls.
     * @example
     * // Create many ApiCalls
     * const apiCall = await prisma.apiCall.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ApiCalls and only return the `id`
     * const apiCallWithIdOnly = await prisma.apiCall.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ApiCallCreateManyAndReturnArgs>(args?: SelectSubset<T, ApiCallCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ApiCall.
     * @param {ApiCallDeleteArgs} args - Arguments to delete one ApiCall.
     * @example
     * // Delete one ApiCall
     * const ApiCall = await prisma.apiCall.delete({
     *   where: {
     *     // ... filter to delete one ApiCall
     *   }
     * })
     * 
     */
    delete<T extends ApiCallDeleteArgs>(args: SelectSubset<T, ApiCallDeleteArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ApiCall.
     * @param {ApiCallUpdateArgs} args - Arguments to update one ApiCall.
     * @example
     * // Update one ApiCall
     * const apiCall = await prisma.apiCall.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ApiCallUpdateArgs>(args: SelectSubset<T, ApiCallUpdateArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ApiCalls.
     * @param {ApiCallDeleteManyArgs} args - Arguments to filter ApiCalls to delete.
     * @example
     * // Delete a few ApiCalls
     * const { count } = await prisma.apiCall.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ApiCallDeleteManyArgs>(args?: SelectSubset<T, ApiCallDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ApiCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ApiCalls
     * const apiCall = await prisma.apiCall.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ApiCallUpdateManyArgs>(args: SelectSubset<T, ApiCallUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ApiCalls and returns the data updated in the database.
     * @param {ApiCallUpdateManyAndReturnArgs} args - Arguments to update many ApiCalls.
     * @example
     * // Update many ApiCalls
     * const apiCall = await prisma.apiCall.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ApiCalls and only return the `id`
     * const apiCallWithIdOnly = await prisma.apiCall.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ApiCallUpdateManyAndReturnArgs>(args: SelectSubset<T, ApiCallUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ApiCall.
     * @param {ApiCallUpsertArgs} args - Arguments to update or create a ApiCall.
     * @example
     * // Update or create a ApiCall
     * const apiCall = await prisma.apiCall.upsert({
     *   create: {
     *     // ... data to create a ApiCall
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ApiCall we want to update
     *   }
     * })
     */
    upsert<T extends ApiCallUpsertArgs>(args: SelectSubset<T, ApiCallUpsertArgs<ExtArgs>>): Prisma__ApiCallClient<$Result.GetResult<Prisma.$ApiCallPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ApiCalls.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallCountArgs} args - Arguments to filter ApiCalls to count.
     * @example
     * // Count the number of ApiCalls
     * const count = await prisma.apiCall.count({
     *   where: {
     *     // ... the filter for the ApiCalls we want to count
     *   }
     * })
    **/
    count<T extends ApiCallCountArgs>(
      args?: Subset<T, ApiCallCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ApiCallCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ApiCall.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ApiCallAggregateArgs>(args: Subset<T, ApiCallAggregateArgs>): Prisma.PrismaPromise<GetApiCallAggregateType<T>>

    /**
     * Group by ApiCall.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ApiCallGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ApiCallGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ApiCallGroupByArgs['orderBy'] }
        : { orderBy?: ApiCallGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ApiCallGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetApiCallGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ApiCall model
   */
  readonly fields: ApiCallFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ApiCall.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ApiCallClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ApiCall model
   */
  interface ApiCallFieldRefs {
    readonly id: FieldRef<"ApiCall", 'String'>
    readonly createdAt: FieldRef<"ApiCall", 'DateTime'>
    readonly endpoint: FieldRef<"ApiCall", 'String'>
    readonly method: FieldRef<"ApiCall", 'String'>
    readonly source: FieldRef<"ApiCall", 'String'>
    readonly templateName: FieldRef<"ApiCall", 'String'>
    readonly transactionId: FieldRef<"ApiCall", 'String'>
    readonly referenceNumber: FieldRef<"ApiCall", 'String'>
    readonly requestHeaders: FieldRef<"ApiCall", 'Json'>
    readonly requestBody: FieldRef<"ApiCall", 'Json'>
    readonly responseBody: FieldRef<"ApiCall", 'Json'>
    readonly httpStatus: FieldRef<"ApiCall", 'Int'>
    readonly httpStatusText: FieldRef<"ApiCall", 'String'>
    readonly durationMs: FieldRef<"ApiCall", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ApiCall findUnique
   */
  export type ApiCallFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter, which ApiCall to fetch.
     */
    where: ApiCallWhereUniqueInput
  }

  /**
   * ApiCall findUniqueOrThrow
   */
  export type ApiCallFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter, which ApiCall to fetch.
     */
    where: ApiCallWhereUniqueInput
  }

  /**
   * ApiCall findFirst
   */
  export type ApiCallFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter, which ApiCall to fetch.
     */
    where?: ApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiCalls to fetch.
     */
    orderBy?: ApiCallOrderByWithRelationInput | ApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiCalls.
     */
    cursor?: ApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiCalls.
     */
    distinct?: ApiCallScalarFieldEnum | ApiCallScalarFieldEnum[]
  }

  /**
   * ApiCall findFirstOrThrow
   */
  export type ApiCallFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter, which ApiCall to fetch.
     */
    where?: ApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiCalls to fetch.
     */
    orderBy?: ApiCallOrderByWithRelationInput | ApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ApiCalls.
     */
    cursor?: ApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiCalls.
     */
    distinct?: ApiCallScalarFieldEnum | ApiCallScalarFieldEnum[]
  }

  /**
   * ApiCall findMany
   */
  export type ApiCallFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter, which ApiCalls to fetch.
     */
    where?: ApiCallWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ApiCalls to fetch.
     */
    orderBy?: ApiCallOrderByWithRelationInput | ApiCallOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ApiCalls.
     */
    cursor?: ApiCallWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ApiCalls from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ApiCalls.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ApiCalls.
     */
    distinct?: ApiCallScalarFieldEnum | ApiCallScalarFieldEnum[]
  }

  /**
   * ApiCall create
   */
  export type ApiCallCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * The data needed to create a ApiCall.
     */
    data: XOR<ApiCallCreateInput, ApiCallUncheckedCreateInput>
  }

  /**
   * ApiCall createMany
   */
  export type ApiCallCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ApiCalls.
     */
    data: ApiCallCreateManyInput | ApiCallCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiCall createManyAndReturn
   */
  export type ApiCallCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * The data used to create many ApiCalls.
     */
    data: ApiCallCreateManyInput | ApiCallCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ApiCall update
   */
  export type ApiCallUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * The data needed to update a ApiCall.
     */
    data: XOR<ApiCallUpdateInput, ApiCallUncheckedUpdateInput>
    /**
     * Choose, which ApiCall to update.
     */
    where: ApiCallWhereUniqueInput
  }

  /**
   * ApiCall updateMany
   */
  export type ApiCallUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ApiCalls.
     */
    data: XOR<ApiCallUpdateManyMutationInput, ApiCallUncheckedUpdateManyInput>
    /**
     * Filter which ApiCalls to update
     */
    where?: ApiCallWhereInput
    /**
     * Limit how many ApiCalls to update.
     */
    limit?: number
  }

  /**
   * ApiCall updateManyAndReturn
   */
  export type ApiCallUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * The data used to update ApiCalls.
     */
    data: XOR<ApiCallUpdateManyMutationInput, ApiCallUncheckedUpdateManyInput>
    /**
     * Filter which ApiCalls to update
     */
    where?: ApiCallWhereInput
    /**
     * Limit how many ApiCalls to update.
     */
    limit?: number
  }

  /**
   * ApiCall upsert
   */
  export type ApiCallUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * The filter to search for the ApiCall to update in case it exists.
     */
    where: ApiCallWhereUniqueInput
    /**
     * In case the ApiCall found by the `where` argument doesn't exist, create a new ApiCall with this data.
     */
    create: XOR<ApiCallCreateInput, ApiCallUncheckedCreateInput>
    /**
     * In case the ApiCall was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ApiCallUpdateInput, ApiCallUncheckedUpdateInput>
  }

  /**
   * ApiCall delete
   */
  export type ApiCallDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
    /**
     * Filter which ApiCall to delete.
     */
    where: ApiCallWhereUniqueInput
  }

  /**
   * ApiCall deleteMany
   */
  export type ApiCallDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ApiCalls to delete
     */
    where?: ApiCallWhereInput
    /**
     * Limit how many ApiCalls to delete.
     */
    limit?: number
  }

  /**
   * ApiCall without action
   */
  export type ApiCallDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ApiCall
     */
    select?: ApiCallSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ApiCall
     */
    omit?: ApiCallOmit<ExtArgs> | null
  }


  /**
   * Model TransactionResponse
   */

  export type AggregateTransactionResponse = {
    _count: TransactionResponseCountAggregateOutputType | null
    _avg: TransactionResponseAvgAggregateOutputType | null
    _sum: TransactionResponseSumAggregateOutputType | null
    _min: TransactionResponseMinAggregateOutputType | null
    _max: TransactionResponseMaxAggregateOutputType | null
  }

  export type TransactionResponseAvgAggregateOutputType = {
    statusCode: number | null
    duration: number | null
  }

  export type TransactionResponseSumAggregateOutputType = {
    statusCode: number | null
    duration: number | null
  }

  export type TransactionResponseMinAggregateOutputType = {
    id: string | null
    transactionId: string | null
    referenceNum: string | null
    endpoint: string | null
    method: string | null
    requestData: string | null
    responseData: string | null
    statusCode: number | null
    statusText: string | null
    duration: number | null
    source: string | null
    createdAt: Date | null
  }

  export type TransactionResponseMaxAggregateOutputType = {
    id: string | null
    transactionId: string | null
    referenceNum: string | null
    endpoint: string | null
    method: string | null
    requestData: string | null
    responseData: string | null
    statusCode: number | null
    statusText: string | null
    duration: number | null
    source: string | null
    createdAt: Date | null
  }

  export type TransactionResponseCountAggregateOutputType = {
    id: number
    transactionId: number
    referenceNum: number
    endpoint: number
    method: number
    requestData: number
    responseData: number
    statusCode: number
    statusText: number
    duration: number
    source: number
    createdAt: number
    _all: number
  }


  export type TransactionResponseAvgAggregateInputType = {
    statusCode?: true
    duration?: true
  }

  export type TransactionResponseSumAggregateInputType = {
    statusCode?: true
    duration?: true
  }

  export type TransactionResponseMinAggregateInputType = {
    id?: true
    transactionId?: true
    referenceNum?: true
    endpoint?: true
    method?: true
    requestData?: true
    responseData?: true
    statusCode?: true
    statusText?: true
    duration?: true
    source?: true
    createdAt?: true
  }

  export type TransactionResponseMaxAggregateInputType = {
    id?: true
    transactionId?: true
    referenceNum?: true
    endpoint?: true
    method?: true
    requestData?: true
    responseData?: true
    statusCode?: true
    statusText?: true
    duration?: true
    source?: true
    createdAt?: true
  }

  export type TransactionResponseCountAggregateInputType = {
    id?: true
    transactionId?: true
    referenceNum?: true
    endpoint?: true
    method?: true
    requestData?: true
    responseData?: true
    statusCode?: true
    statusText?: true
    duration?: true
    source?: true
    createdAt?: true
    _all?: true
  }

  export type TransactionResponseAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TransactionResponse to aggregate.
     */
    where?: TransactionResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TransactionResponses to fetch.
     */
    orderBy?: TransactionResponseOrderByWithRelationInput | TransactionResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TransactionResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TransactionResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TransactionResponses
    **/
    _count?: true | TransactionResponseCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionResponseAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionResponseSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionResponseMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionResponseMaxAggregateInputType
  }

  export type GetTransactionResponseAggregateType<T extends TransactionResponseAggregateArgs> = {
        [P in keyof T & keyof AggregateTransactionResponse]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransactionResponse[P]>
      : GetScalarType<T[P], AggregateTransactionResponse[P]>
  }




  export type TransactionResponseGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionResponseWhereInput
    orderBy?: TransactionResponseOrderByWithAggregationInput | TransactionResponseOrderByWithAggregationInput[]
    by: TransactionResponseScalarFieldEnum[] | TransactionResponseScalarFieldEnum
    having?: TransactionResponseScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionResponseCountAggregateInputType | true
    _avg?: TransactionResponseAvgAggregateInputType
    _sum?: TransactionResponseSumAggregateInputType
    _min?: TransactionResponseMinAggregateInputType
    _max?: TransactionResponseMaxAggregateInputType
  }

  export type TransactionResponseGroupByOutputType = {
    id: string
    transactionId: string | null
    referenceNum: string | null
    endpoint: string
    method: string
    requestData: string
    responseData: string
    statusCode: number
    statusText: string
    duration: number | null
    source: string
    createdAt: Date
    _count: TransactionResponseCountAggregateOutputType | null
    _avg: TransactionResponseAvgAggregateOutputType | null
    _sum: TransactionResponseSumAggregateOutputType | null
    _min: TransactionResponseMinAggregateOutputType | null
    _max: TransactionResponseMaxAggregateOutputType | null
  }

  type GetTransactionResponseGroupByPayload<T extends TransactionResponseGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionResponseGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionResponseGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionResponseGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionResponseGroupByOutputType[P]>
        }
      >
    >


  export type TransactionResponseSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    transactionId?: boolean
    referenceNum?: boolean
    endpoint?: boolean
    method?: boolean
    requestData?: boolean
    responseData?: boolean
    statusCode?: boolean
    statusText?: boolean
    duration?: boolean
    source?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["transactionResponse"]>

  export type TransactionResponseSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    transactionId?: boolean
    referenceNum?: boolean
    endpoint?: boolean
    method?: boolean
    requestData?: boolean
    responseData?: boolean
    statusCode?: boolean
    statusText?: boolean
    duration?: boolean
    source?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["transactionResponse"]>

  export type TransactionResponseSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    transactionId?: boolean
    referenceNum?: boolean
    endpoint?: boolean
    method?: boolean
    requestData?: boolean
    responseData?: boolean
    statusCode?: boolean
    statusText?: boolean
    duration?: boolean
    source?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["transactionResponse"]>

  export type TransactionResponseSelectScalar = {
    id?: boolean
    transactionId?: boolean
    referenceNum?: boolean
    endpoint?: boolean
    method?: boolean
    requestData?: boolean
    responseData?: boolean
    statusCode?: boolean
    statusText?: boolean
    duration?: boolean
    source?: boolean
    createdAt?: boolean
  }

  export type TransactionResponseOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "transactionId" | "referenceNum" | "endpoint" | "method" | "requestData" | "responseData" | "statusCode" | "statusText" | "duration" | "source" | "createdAt", ExtArgs["result"]["transactionResponse"]>

  export type $TransactionResponsePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TransactionResponse"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      transactionId: string | null
      referenceNum: string | null
      endpoint: string
      method: string
      requestData: string
      responseData: string
      statusCode: number
      statusText: string
      duration: number | null
      source: string
      createdAt: Date
    }, ExtArgs["result"]["transactionResponse"]>
    composites: {}
  }

  type TransactionResponseGetPayload<S extends boolean | null | undefined | TransactionResponseDefaultArgs> = $Result.GetResult<Prisma.$TransactionResponsePayload, S>

  type TransactionResponseCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TransactionResponseFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TransactionResponseCountAggregateInputType | true
    }

  export interface TransactionResponseDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TransactionResponse'], meta: { name: 'TransactionResponse' } }
    /**
     * Find zero or one TransactionResponse that matches the filter.
     * @param {TransactionResponseFindUniqueArgs} args - Arguments to find a TransactionResponse
     * @example
     * // Get one TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionResponseFindUniqueArgs>(args: SelectSubset<T, TransactionResponseFindUniqueArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TransactionResponse that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TransactionResponseFindUniqueOrThrowArgs} args - Arguments to find a TransactionResponse
     * @example
     * // Get one TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionResponseFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionResponseFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TransactionResponse that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseFindFirstArgs} args - Arguments to find a TransactionResponse
     * @example
     * // Get one TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionResponseFindFirstArgs>(args?: SelectSubset<T, TransactionResponseFindFirstArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TransactionResponse that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseFindFirstOrThrowArgs} args - Arguments to find a TransactionResponse
     * @example
     * // Get one TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionResponseFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionResponseFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TransactionResponses that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TransactionResponses
     * const transactionResponses = await prisma.transactionResponse.findMany()
     * 
     * // Get first 10 TransactionResponses
     * const transactionResponses = await prisma.transactionResponse.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionResponseWithIdOnly = await prisma.transactionResponse.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionResponseFindManyArgs>(args?: SelectSubset<T, TransactionResponseFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TransactionResponse.
     * @param {TransactionResponseCreateArgs} args - Arguments to create a TransactionResponse.
     * @example
     * // Create one TransactionResponse
     * const TransactionResponse = await prisma.transactionResponse.create({
     *   data: {
     *     // ... data to create a TransactionResponse
     *   }
     * })
     * 
     */
    create<T extends TransactionResponseCreateArgs>(args: SelectSubset<T, TransactionResponseCreateArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TransactionResponses.
     * @param {TransactionResponseCreateManyArgs} args - Arguments to create many TransactionResponses.
     * @example
     * // Create many TransactionResponses
     * const transactionResponse = await prisma.transactionResponse.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionResponseCreateManyArgs>(args?: SelectSubset<T, TransactionResponseCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TransactionResponses and returns the data saved in the database.
     * @param {TransactionResponseCreateManyAndReturnArgs} args - Arguments to create many TransactionResponses.
     * @example
     * // Create many TransactionResponses
     * const transactionResponse = await prisma.transactionResponse.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TransactionResponses and only return the `id`
     * const transactionResponseWithIdOnly = await prisma.transactionResponse.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionResponseCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionResponseCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TransactionResponse.
     * @param {TransactionResponseDeleteArgs} args - Arguments to delete one TransactionResponse.
     * @example
     * // Delete one TransactionResponse
     * const TransactionResponse = await prisma.transactionResponse.delete({
     *   where: {
     *     // ... filter to delete one TransactionResponse
     *   }
     * })
     * 
     */
    delete<T extends TransactionResponseDeleteArgs>(args: SelectSubset<T, TransactionResponseDeleteArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TransactionResponse.
     * @param {TransactionResponseUpdateArgs} args - Arguments to update one TransactionResponse.
     * @example
     * // Update one TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionResponseUpdateArgs>(args: SelectSubset<T, TransactionResponseUpdateArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TransactionResponses.
     * @param {TransactionResponseDeleteManyArgs} args - Arguments to filter TransactionResponses to delete.
     * @example
     * // Delete a few TransactionResponses
     * const { count } = await prisma.transactionResponse.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionResponseDeleteManyArgs>(args?: SelectSubset<T, TransactionResponseDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TransactionResponses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TransactionResponses
     * const transactionResponse = await prisma.transactionResponse.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionResponseUpdateManyArgs>(args: SelectSubset<T, TransactionResponseUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TransactionResponses and returns the data updated in the database.
     * @param {TransactionResponseUpdateManyAndReturnArgs} args - Arguments to update many TransactionResponses.
     * @example
     * // Update many TransactionResponses
     * const transactionResponse = await prisma.transactionResponse.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TransactionResponses and only return the `id`
     * const transactionResponseWithIdOnly = await prisma.transactionResponse.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TransactionResponseUpdateManyAndReturnArgs>(args: SelectSubset<T, TransactionResponseUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TransactionResponse.
     * @param {TransactionResponseUpsertArgs} args - Arguments to update or create a TransactionResponse.
     * @example
     * // Update or create a TransactionResponse
     * const transactionResponse = await prisma.transactionResponse.upsert({
     *   create: {
     *     // ... data to create a TransactionResponse
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TransactionResponse we want to update
     *   }
     * })
     */
    upsert<T extends TransactionResponseUpsertArgs>(args: SelectSubset<T, TransactionResponseUpsertArgs<ExtArgs>>): Prisma__TransactionResponseClient<$Result.GetResult<Prisma.$TransactionResponsePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TransactionResponses.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseCountArgs} args - Arguments to filter TransactionResponses to count.
     * @example
     * // Count the number of TransactionResponses
     * const count = await prisma.transactionResponse.count({
     *   where: {
     *     // ... the filter for the TransactionResponses we want to count
     *   }
     * })
    **/
    count<T extends TransactionResponseCountArgs>(
      args?: Subset<T, TransactionResponseCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionResponseCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TransactionResponse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionResponseAggregateArgs>(args: Subset<T, TransactionResponseAggregateArgs>): Prisma.PrismaPromise<GetTransactionResponseAggregateType<T>>

    /**
     * Group by TransactionResponse.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionResponseGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionResponseGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionResponseGroupByArgs['orderBy'] }
        : { orderBy?: TransactionResponseGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionResponseGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionResponseGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TransactionResponse model
   */
  readonly fields: TransactionResponseFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TransactionResponse.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionResponseClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TransactionResponse model
   */
  interface TransactionResponseFieldRefs {
    readonly id: FieldRef<"TransactionResponse", 'String'>
    readonly transactionId: FieldRef<"TransactionResponse", 'String'>
    readonly referenceNum: FieldRef<"TransactionResponse", 'String'>
    readonly endpoint: FieldRef<"TransactionResponse", 'String'>
    readonly method: FieldRef<"TransactionResponse", 'String'>
    readonly requestData: FieldRef<"TransactionResponse", 'String'>
    readonly responseData: FieldRef<"TransactionResponse", 'String'>
    readonly statusCode: FieldRef<"TransactionResponse", 'Int'>
    readonly statusText: FieldRef<"TransactionResponse", 'String'>
    readonly duration: FieldRef<"TransactionResponse", 'Int'>
    readonly source: FieldRef<"TransactionResponse", 'String'>
    readonly createdAt: FieldRef<"TransactionResponse", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TransactionResponse findUnique
   */
  export type TransactionResponseFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter, which TransactionResponse to fetch.
     */
    where: TransactionResponseWhereUniqueInput
  }

  /**
   * TransactionResponse findUniqueOrThrow
   */
  export type TransactionResponseFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter, which TransactionResponse to fetch.
     */
    where: TransactionResponseWhereUniqueInput
  }

  /**
   * TransactionResponse findFirst
   */
  export type TransactionResponseFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter, which TransactionResponse to fetch.
     */
    where?: TransactionResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TransactionResponses to fetch.
     */
    orderBy?: TransactionResponseOrderByWithRelationInput | TransactionResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TransactionResponses.
     */
    cursor?: TransactionResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TransactionResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TransactionResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TransactionResponses.
     */
    distinct?: TransactionResponseScalarFieldEnum | TransactionResponseScalarFieldEnum[]
  }

  /**
   * TransactionResponse findFirstOrThrow
   */
  export type TransactionResponseFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter, which TransactionResponse to fetch.
     */
    where?: TransactionResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TransactionResponses to fetch.
     */
    orderBy?: TransactionResponseOrderByWithRelationInput | TransactionResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TransactionResponses.
     */
    cursor?: TransactionResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TransactionResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TransactionResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TransactionResponses.
     */
    distinct?: TransactionResponseScalarFieldEnum | TransactionResponseScalarFieldEnum[]
  }

  /**
   * TransactionResponse findMany
   */
  export type TransactionResponseFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter, which TransactionResponses to fetch.
     */
    where?: TransactionResponseWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TransactionResponses to fetch.
     */
    orderBy?: TransactionResponseOrderByWithRelationInput | TransactionResponseOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TransactionResponses.
     */
    cursor?: TransactionResponseWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TransactionResponses from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TransactionResponses.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TransactionResponses.
     */
    distinct?: TransactionResponseScalarFieldEnum | TransactionResponseScalarFieldEnum[]
  }

  /**
   * TransactionResponse create
   */
  export type TransactionResponseCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * The data needed to create a TransactionResponse.
     */
    data: XOR<TransactionResponseCreateInput, TransactionResponseUncheckedCreateInput>
  }

  /**
   * TransactionResponse createMany
   */
  export type TransactionResponseCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TransactionResponses.
     */
    data: TransactionResponseCreateManyInput | TransactionResponseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TransactionResponse createManyAndReturn
   */
  export type TransactionResponseCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * The data used to create many TransactionResponses.
     */
    data: TransactionResponseCreateManyInput | TransactionResponseCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TransactionResponse update
   */
  export type TransactionResponseUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * The data needed to update a TransactionResponse.
     */
    data: XOR<TransactionResponseUpdateInput, TransactionResponseUncheckedUpdateInput>
    /**
     * Choose, which TransactionResponse to update.
     */
    where: TransactionResponseWhereUniqueInput
  }

  /**
   * TransactionResponse updateMany
   */
  export type TransactionResponseUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TransactionResponses.
     */
    data: XOR<TransactionResponseUpdateManyMutationInput, TransactionResponseUncheckedUpdateManyInput>
    /**
     * Filter which TransactionResponses to update
     */
    where?: TransactionResponseWhereInput
    /**
     * Limit how many TransactionResponses to update.
     */
    limit?: number
  }

  /**
   * TransactionResponse updateManyAndReturn
   */
  export type TransactionResponseUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * The data used to update TransactionResponses.
     */
    data: XOR<TransactionResponseUpdateManyMutationInput, TransactionResponseUncheckedUpdateManyInput>
    /**
     * Filter which TransactionResponses to update
     */
    where?: TransactionResponseWhereInput
    /**
     * Limit how many TransactionResponses to update.
     */
    limit?: number
  }

  /**
   * TransactionResponse upsert
   */
  export type TransactionResponseUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * The filter to search for the TransactionResponse to update in case it exists.
     */
    where: TransactionResponseWhereUniqueInput
    /**
     * In case the TransactionResponse found by the `where` argument doesn't exist, create a new TransactionResponse with this data.
     */
    create: XOR<TransactionResponseCreateInput, TransactionResponseUncheckedCreateInput>
    /**
     * In case the TransactionResponse was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionResponseUpdateInput, TransactionResponseUncheckedUpdateInput>
  }

  /**
   * TransactionResponse delete
   */
  export type TransactionResponseDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
    /**
     * Filter which TransactionResponse to delete.
     */
    where: TransactionResponseWhereUniqueInput
  }

  /**
   * TransactionResponse deleteMany
   */
  export type TransactionResponseDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TransactionResponses to delete
     */
    where?: TransactionResponseWhereInput
    /**
     * Limit how many TransactionResponses to delete.
     */
    limit?: number
  }

  /**
   * TransactionResponse without action
   */
  export type TransactionResponseDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TransactionResponse
     */
    select?: TransactionResponseSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TransactionResponse
     */
    omit?: TransactionResponseOmit<ExtArgs> | null
  }


  /**
   * Model WebhookEvent
   */

  export type AggregateWebhookEvent = {
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  export type WebhookEventMinAggregateOutputType = {
    id: string | null
    eventType: string | null
    source: string | null
    receivedAt: Date | null
  }

  export type WebhookEventMaxAggregateOutputType = {
    id: string | null
    eventType: string | null
    source: string | null
    receivedAt: Date | null
  }

  export type WebhookEventCountAggregateOutputType = {
    id: number
    eventType: number
    source: number
    payload: number
    headers: number
    receivedAt: number
    _all: number
  }


  export type WebhookEventMinAggregateInputType = {
    id?: true
    eventType?: true
    source?: true
    receivedAt?: true
  }

  export type WebhookEventMaxAggregateInputType = {
    id?: true
    eventType?: true
    source?: true
    receivedAt?: true
  }

  export type WebhookEventCountAggregateInputType = {
    id?: true
    eventType?: true
    source?: true
    payload?: true
    headers?: true
    receivedAt?: true
    _all?: true
  }

  export type WebhookEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvent to aggregate.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebhookEvents
    **/
    _count?: true | WebhookEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebhookEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebhookEventMaxAggregateInputType
  }

  export type GetWebhookEventAggregateType<T extends WebhookEventAggregateArgs> = {
        [P in keyof T & keyof AggregateWebhookEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebhookEvent[P]>
      : GetScalarType<T[P], AggregateWebhookEvent[P]>
  }




  export type WebhookEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookEventWhereInput
    orderBy?: WebhookEventOrderByWithAggregationInput | WebhookEventOrderByWithAggregationInput[]
    by: WebhookEventScalarFieldEnum[] | WebhookEventScalarFieldEnum
    having?: WebhookEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebhookEventCountAggregateInputType | true
    _min?: WebhookEventMinAggregateInputType
    _max?: WebhookEventMaxAggregateInputType
  }

  export type WebhookEventGroupByOutputType = {
    id: string
    eventType: string
    source: string
    payload: JsonValue
    headers: JsonValue | null
    receivedAt: Date
    _count: WebhookEventCountAggregateOutputType | null
    _min: WebhookEventMinAggregateOutputType | null
    _max: WebhookEventMaxAggregateOutputType | null
  }

  type GetWebhookEventGroupByPayload<T extends WebhookEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebhookEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebhookEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
            : GetScalarType<T[P], WebhookEventGroupByOutputType[P]>
        }
      >
    >


  export type WebhookEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    source?: boolean
    payload?: boolean
    headers?: boolean
    receivedAt?: boolean
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    source?: boolean
    payload?: boolean
    headers?: boolean
    receivedAt?: boolean
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    source?: boolean
    payload?: boolean
    headers?: boolean
    receivedAt?: boolean
  }, ExtArgs["result"]["webhookEvent"]>

  export type WebhookEventSelectScalar = {
    id?: boolean
    eventType?: boolean
    source?: boolean
    payload?: boolean
    headers?: boolean
    receivedAt?: boolean
  }

  export type WebhookEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventType" | "source" | "payload" | "headers" | "receivedAt", ExtArgs["result"]["webhookEvent"]>

  export type $WebhookEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebhookEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventType: string
      source: string
      payload: Prisma.JsonValue
      headers: Prisma.JsonValue | null
      receivedAt: Date
    }, ExtArgs["result"]["webhookEvent"]>
    composites: {}
  }

  type WebhookEventGetPayload<S extends boolean | null | undefined | WebhookEventDefaultArgs> = $Result.GetResult<Prisma.$WebhookEventPayload, S>

  type WebhookEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WebhookEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WebhookEventCountAggregateInputType | true
    }

  export interface WebhookEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebhookEvent'], meta: { name: 'WebhookEvent' } }
    /**
     * Find zero or one WebhookEvent that matches the filter.
     * @param {WebhookEventFindUniqueArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebhookEventFindUniqueArgs>(args: SelectSubset<T, WebhookEventFindUniqueArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WebhookEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WebhookEventFindUniqueOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebhookEventFindUniqueOrThrowArgs>(args: SelectSubset<T, WebhookEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebhookEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebhookEventFindFirstArgs>(args?: SelectSubset<T, WebhookEventFindFirstArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebhookEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindFirstOrThrowArgs} args - Arguments to find a WebhookEvent
     * @example
     * // Get one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebhookEventFindFirstOrThrowArgs>(args?: SelectSubset<T, WebhookEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WebhookEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany()
     * 
     * // Get first 10 WebhookEvents
     * const webhookEvents = await prisma.webhookEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebhookEventFindManyArgs>(args?: SelectSubset<T, WebhookEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WebhookEvent.
     * @param {WebhookEventCreateArgs} args - Arguments to create a WebhookEvent.
     * @example
     * // Create one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.create({
     *   data: {
     *     // ... data to create a WebhookEvent
     *   }
     * })
     * 
     */
    create<T extends WebhookEventCreateArgs>(args: SelectSubset<T, WebhookEventCreateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WebhookEvents.
     * @param {WebhookEventCreateManyArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebhookEventCreateManyArgs>(args?: SelectSubset<T, WebhookEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebhookEvents and returns the data saved in the database.
     * @param {WebhookEventCreateManyAndReturnArgs} args - Arguments to create many WebhookEvents.
     * @example
     * // Create many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebhookEvents and only return the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebhookEventCreateManyAndReturnArgs>(args?: SelectSubset<T, WebhookEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WebhookEvent.
     * @param {WebhookEventDeleteArgs} args - Arguments to delete one WebhookEvent.
     * @example
     * // Delete one WebhookEvent
     * const WebhookEvent = await prisma.webhookEvent.delete({
     *   where: {
     *     // ... filter to delete one WebhookEvent
     *   }
     * })
     * 
     */
    delete<T extends WebhookEventDeleteArgs>(args: SelectSubset<T, WebhookEventDeleteArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WebhookEvent.
     * @param {WebhookEventUpdateArgs} args - Arguments to update one WebhookEvent.
     * @example
     * // Update one WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebhookEventUpdateArgs>(args: SelectSubset<T, WebhookEventUpdateArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WebhookEvents.
     * @param {WebhookEventDeleteManyArgs} args - Arguments to filter WebhookEvents to delete.
     * @example
     * // Delete a few WebhookEvents
     * const { count } = await prisma.webhookEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebhookEventDeleteManyArgs>(args?: SelectSubset<T, WebhookEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebhookEventUpdateManyArgs>(args: SelectSubset<T, WebhookEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookEvents and returns the data updated in the database.
     * @param {WebhookEventUpdateManyAndReturnArgs} args - Arguments to update many WebhookEvents.
     * @example
     * // Update many WebhookEvents
     * const webhookEvent = await prisma.webhookEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WebhookEvents and only return the `id`
     * const webhookEventWithIdOnly = await prisma.webhookEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WebhookEventUpdateManyAndReturnArgs>(args: SelectSubset<T, WebhookEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WebhookEvent.
     * @param {WebhookEventUpsertArgs} args - Arguments to update or create a WebhookEvent.
     * @example
     * // Update or create a WebhookEvent
     * const webhookEvent = await prisma.webhookEvent.upsert({
     *   create: {
     *     // ... data to create a WebhookEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebhookEvent we want to update
     *   }
     * })
     */
    upsert<T extends WebhookEventUpsertArgs>(args: SelectSubset<T, WebhookEventUpsertArgs<ExtArgs>>): Prisma__WebhookEventClient<$Result.GetResult<Prisma.$WebhookEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WebhookEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventCountArgs} args - Arguments to filter WebhookEvents to count.
     * @example
     * // Count the number of WebhookEvents
     * const count = await prisma.webhookEvent.count({
     *   where: {
     *     // ... the filter for the WebhookEvents we want to count
     *   }
     * })
    **/
    count<T extends WebhookEventCountArgs>(
      args?: Subset<T, WebhookEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebhookEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebhookEventAggregateArgs>(args: Subset<T, WebhookEventAggregateArgs>): Prisma.PrismaPromise<GetWebhookEventAggregateType<T>>

    /**
     * Group by WebhookEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebhookEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebhookEventGroupByArgs['orderBy'] }
        : { orderBy?: WebhookEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebhookEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebhookEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebhookEvent model
   */
  readonly fields: WebhookEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebhookEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebhookEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebhookEvent model
   */
  interface WebhookEventFieldRefs {
    readonly id: FieldRef<"WebhookEvent", 'String'>
    readonly eventType: FieldRef<"WebhookEvent", 'String'>
    readonly source: FieldRef<"WebhookEvent", 'String'>
    readonly payload: FieldRef<"WebhookEvent", 'Json'>
    readonly headers: FieldRef<"WebhookEvent", 'Json'>
    readonly receivedAt: FieldRef<"WebhookEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WebhookEvent findUnique
   */
  export type WebhookEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findUniqueOrThrow
   */
  export type WebhookEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent findFirst
   */
  export type WebhookEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findFirstOrThrow
   */
  export type WebhookEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter, which WebhookEvent to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent findMany
   */
  export type WebhookEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter, which WebhookEvents to fetch.
     */
    where?: WebhookEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookEvents to fetch.
     */
    orderBy?: WebhookEventOrderByWithRelationInput | WebhookEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebhookEvents.
     */
    cursor?: WebhookEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookEvents.
     */
    distinct?: WebhookEventScalarFieldEnum | WebhookEventScalarFieldEnum[]
  }

  /**
   * WebhookEvent create
   */
  export type WebhookEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * The data needed to create a WebhookEvent.
     */
    data: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
  }

  /**
   * WebhookEvent createMany
   */
  export type WebhookEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookEvent createManyAndReturn
   */
  export type WebhookEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * The data used to create many WebhookEvents.
     */
    data: WebhookEventCreateManyInput | WebhookEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookEvent update
   */
  export type WebhookEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * The data needed to update a WebhookEvent.
     */
    data: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
    /**
     * Choose, which WebhookEvent to update.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent updateMany
   */
  export type WebhookEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebhookEvents.
     */
    data: XOR<WebhookEventUpdateManyMutationInput, WebhookEventUncheckedUpdateManyInput>
    /**
     * Filter which WebhookEvents to update
     */
    where?: WebhookEventWhereInput
    /**
     * Limit how many WebhookEvents to update.
     */
    limit?: number
  }

  /**
   * WebhookEvent updateManyAndReturn
   */
  export type WebhookEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * The data used to update WebhookEvents.
     */
    data: XOR<WebhookEventUpdateManyMutationInput, WebhookEventUncheckedUpdateManyInput>
    /**
     * Filter which WebhookEvents to update
     */
    where?: WebhookEventWhereInput
    /**
     * Limit how many WebhookEvents to update.
     */
    limit?: number
  }

  /**
   * WebhookEvent upsert
   */
  export type WebhookEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * The filter to search for the WebhookEvent to update in case it exists.
     */
    where: WebhookEventWhereUniqueInput
    /**
     * In case the WebhookEvent found by the `where` argument doesn't exist, create a new WebhookEvent with this data.
     */
    create: XOR<WebhookEventCreateInput, WebhookEventUncheckedCreateInput>
    /**
     * In case the WebhookEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebhookEventUpdateInput, WebhookEventUncheckedUpdateInput>
  }

  /**
   * WebhookEvent delete
   */
  export type WebhookEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
    /**
     * Filter which WebhookEvent to delete.
     */
    where: WebhookEventWhereUniqueInput
  }

  /**
   * WebhookEvent deleteMany
   */
  export type WebhookEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookEvents to delete
     */
    where?: WebhookEventWhereInput
    /**
     * Limit how many WebhookEvents to delete.
     */
    limit?: number
  }

  /**
   * WebhookEvent without action
   */
  export type WebhookEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookEvent
     */
    select?: WebhookEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookEvent
     */
    omit?: WebhookEventOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ApiCallScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    endpoint: 'endpoint',
    method: 'method',
    source: 'source',
    templateName: 'templateName',
    transactionId: 'transactionId',
    referenceNumber: 'referenceNumber',
    requestHeaders: 'requestHeaders',
    requestBody: 'requestBody',
    responseBody: 'responseBody',
    httpStatus: 'httpStatus',
    httpStatusText: 'httpStatusText',
    durationMs: 'durationMs'
  };

  export type ApiCallScalarFieldEnum = (typeof ApiCallScalarFieldEnum)[keyof typeof ApiCallScalarFieldEnum]


  export const TransactionResponseScalarFieldEnum: {
    id: 'id',
    transactionId: 'transactionId',
    referenceNum: 'referenceNum',
    endpoint: 'endpoint',
    method: 'method',
    requestData: 'requestData',
    responseData: 'responseData',
    statusCode: 'statusCode',
    statusText: 'statusText',
    duration: 'duration',
    source: 'source',
    createdAt: 'createdAt'
  };

  export type TransactionResponseScalarFieldEnum = (typeof TransactionResponseScalarFieldEnum)[keyof typeof TransactionResponseScalarFieldEnum]


  export const WebhookEventScalarFieldEnum: {
    id: 'id',
    eventType: 'eventType',
    source: 'source',
    payload: 'payload',
    headers: 'headers',
    receivedAt: 'receivedAt'
  };

  export type WebhookEventScalarFieldEnum = (typeof WebhookEventScalarFieldEnum)[keyof typeof WebhookEventScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ApiCallWhereInput = {
    AND?: ApiCallWhereInput | ApiCallWhereInput[]
    OR?: ApiCallWhereInput[]
    NOT?: ApiCallWhereInput | ApiCallWhereInput[]
    id?: StringFilter<"ApiCall"> | string
    createdAt?: DateTimeFilter<"ApiCall"> | Date | string
    endpoint?: StringFilter<"ApiCall"> | string
    method?: StringFilter<"ApiCall"> | string
    source?: StringFilter<"ApiCall"> | string
    templateName?: StringNullableFilter<"ApiCall"> | string | null
    transactionId?: StringNullableFilter<"ApiCall"> | string | null
    referenceNumber?: StringNullableFilter<"ApiCall"> | string | null
    requestHeaders?: JsonFilter<"ApiCall">
    requestBody?: JsonNullableFilter<"ApiCall">
    responseBody?: JsonNullableFilter<"ApiCall">
    httpStatus?: IntFilter<"ApiCall"> | number
    httpStatusText?: StringFilter<"ApiCall"> | string
    durationMs?: IntNullableFilter<"ApiCall"> | number | null
  }

  export type ApiCallOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    source?: SortOrder
    templateName?: SortOrderInput | SortOrder
    transactionId?: SortOrderInput | SortOrder
    referenceNumber?: SortOrderInput | SortOrder
    requestHeaders?: SortOrder
    requestBody?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    httpStatus?: SortOrder
    httpStatusText?: SortOrder
    durationMs?: SortOrderInput | SortOrder
  }

  export type ApiCallWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ApiCallWhereInput | ApiCallWhereInput[]
    OR?: ApiCallWhereInput[]
    NOT?: ApiCallWhereInput | ApiCallWhereInput[]
    createdAt?: DateTimeFilter<"ApiCall"> | Date | string
    endpoint?: StringFilter<"ApiCall"> | string
    method?: StringFilter<"ApiCall"> | string
    source?: StringFilter<"ApiCall"> | string
    templateName?: StringNullableFilter<"ApiCall"> | string | null
    transactionId?: StringNullableFilter<"ApiCall"> | string | null
    referenceNumber?: StringNullableFilter<"ApiCall"> | string | null
    requestHeaders?: JsonFilter<"ApiCall">
    requestBody?: JsonNullableFilter<"ApiCall">
    responseBody?: JsonNullableFilter<"ApiCall">
    httpStatus?: IntFilter<"ApiCall"> | number
    httpStatusText?: StringFilter<"ApiCall"> | string
    durationMs?: IntNullableFilter<"ApiCall"> | number | null
  }, "id">

  export type ApiCallOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    source?: SortOrder
    templateName?: SortOrderInput | SortOrder
    transactionId?: SortOrderInput | SortOrder
    referenceNumber?: SortOrderInput | SortOrder
    requestHeaders?: SortOrder
    requestBody?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    httpStatus?: SortOrder
    httpStatusText?: SortOrder
    durationMs?: SortOrderInput | SortOrder
    _count?: ApiCallCountOrderByAggregateInput
    _avg?: ApiCallAvgOrderByAggregateInput
    _max?: ApiCallMaxOrderByAggregateInput
    _min?: ApiCallMinOrderByAggregateInput
    _sum?: ApiCallSumOrderByAggregateInput
  }

  export type ApiCallScalarWhereWithAggregatesInput = {
    AND?: ApiCallScalarWhereWithAggregatesInput | ApiCallScalarWhereWithAggregatesInput[]
    OR?: ApiCallScalarWhereWithAggregatesInput[]
    NOT?: ApiCallScalarWhereWithAggregatesInput | ApiCallScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ApiCall"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ApiCall"> | Date | string
    endpoint?: StringWithAggregatesFilter<"ApiCall"> | string
    method?: StringWithAggregatesFilter<"ApiCall"> | string
    source?: StringWithAggregatesFilter<"ApiCall"> | string
    templateName?: StringNullableWithAggregatesFilter<"ApiCall"> | string | null
    transactionId?: StringNullableWithAggregatesFilter<"ApiCall"> | string | null
    referenceNumber?: StringNullableWithAggregatesFilter<"ApiCall"> | string | null
    requestHeaders?: JsonWithAggregatesFilter<"ApiCall">
    requestBody?: JsonNullableWithAggregatesFilter<"ApiCall">
    responseBody?: JsonNullableWithAggregatesFilter<"ApiCall">
    httpStatus?: IntWithAggregatesFilter<"ApiCall"> | number
    httpStatusText?: StringWithAggregatesFilter<"ApiCall"> | string
    durationMs?: IntNullableWithAggregatesFilter<"ApiCall"> | number | null
  }

  export type TransactionResponseWhereInput = {
    AND?: TransactionResponseWhereInput | TransactionResponseWhereInput[]
    OR?: TransactionResponseWhereInput[]
    NOT?: TransactionResponseWhereInput | TransactionResponseWhereInput[]
    id?: StringFilter<"TransactionResponse"> | string
    transactionId?: StringNullableFilter<"TransactionResponse"> | string | null
    referenceNum?: StringNullableFilter<"TransactionResponse"> | string | null
    endpoint?: StringFilter<"TransactionResponse"> | string
    method?: StringFilter<"TransactionResponse"> | string
    requestData?: StringFilter<"TransactionResponse"> | string
    responseData?: StringFilter<"TransactionResponse"> | string
    statusCode?: IntFilter<"TransactionResponse"> | number
    statusText?: StringFilter<"TransactionResponse"> | string
    duration?: IntNullableFilter<"TransactionResponse"> | number | null
    source?: StringFilter<"TransactionResponse"> | string
    createdAt?: DateTimeFilter<"TransactionResponse"> | Date | string
  }

  export type TransactionResponseOrderByWithRelationInput = {
    id?: SortOrder
    transactionId?: SortOrderInput | SortOrder
    referenceNum?: SortOrderInput | SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    requestData?: SortOrder
    responseData?: SortOrder
    statusCode?: SortOrder
    statusText?: SortOrder
    duration?: SortOrderInput | SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionResponseWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TransactionResponseWhereInput | TransactionResponseWhereInput[]
    OR?: TransactionResponseWhereInput[]
    NOT?: TransactionResponseWhereInput | TransactionResponseWhereInput[]
    transactionId?: StringNullableFilter<"TransactionResponse"> | string | null
    referenceNum?: StringNullableFilter<"TransactionResponse"> | string | null
    endpoint?: StringFilter<"TransactionResponse"> | string
    method?: StringFilter<"TransactionResponse"> | string
    requestData?: StringFilter<"TransactionResponse"> | string
    responseData?: StringFilter<"TransactionResponse"> | string
    statusCode?: IntFilter<"TransactionResponse"> | number
    statusText?: StringFilter<"TransactionResponse"> | string
    duration?: IntNullableFilter<"TransactionResponse"> | number | null
    source?: StringFilter<"TransactionResponse"> | string
    createdAt?: DateTimeFilter<"TransactionResponse"> | Date | string
  }, "id">

  export type TransactionResponseOrderByWithAggregationInput = {
    id?: SortOrder
    transactionId?: SortOrderInput | SortOrder
    referenceNum?: SortOrderInput | SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    requestData?: SortOrder
    responseData?: SortOrder
    statusCode?: SortOrder
    statusText?: SortOrder
    duration?: SortOrderInput | SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    _count?: TransactionResponseCountOrderByAggregateInput
    _avg?: TransactionResponseAvgOrderByAggregateInput
    _max?: TransactionResponseMaxOrderByAggregateInput
    _min?: TransactionResponseMinOrderByAggregateInput
    _sum?: TransactionResponseSumOrderByAggregateInput
  }

  export type TransactionResponseScalarWhereWithAggregatesInput = {
    AND?: TransactionResponseScalarWhereWithAggregatesInput | TransactionResponseScalarWhereWithAggregatesInput[]
    OR?: TransactionResponseScalarWhereWithAggregatesInput[]
    NOT?: TransactionResponseScalarWhereWithAggregatesInput | TransactionResponseScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TransactionResponse"> | string
    transactionId?: StringNullableWithAggregatesFilter<"TransactionResponse"> | string | null
    referenceNum?: StringNullableWithAggregatesFilter<"TransactionResponse"> | string | null
    endpoint?: StringWithAggregatesFilter<"TransactionResponse"> | string
    method?: StringWithAggregatesFilter<"TransactionResponse"> | string
    requestData?: StringWithAggregatesFilter<"TransactionResponse"> | string
    responseData?: StringWithAggregatesFilter<"TransactionResponse"> | string
    statusCode?: IntWithAggregatesFilter<"TransactionResponse"> | number
    statusText?: StringWithAggregatesFilter<"TransactionResponse"> | string
    duration?: IntNullableWithAggregatesFilter<"TransactionResponse"> | number | null
    source?: StringWithAggregatesFilter<"TransactionResponse"> | string
    createdAt?: DateTimeWithAggregatesFilter<"TransactionResponse"> | Date | string
  }

  export type WebhookEventWhereInput = {
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    id?: StringFilter<"WebhookEvent"> | string
    eventType?: StringFilter<"WebhookEvent"> | string
    source?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    headers?: JsonNullableFilter<"WebhookEvent">
    receivedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
  }

  export type WebhookEventOrderByWithRelationInput = {
    id?: SortOrder
    eventType?: SortOrder
    source?: SortOrder
    payload?: SortOrder
    headers?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
  }

  export type WebhookEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WebhookEventWhereInput | WebhookEventWhereInput[]
    OR?: WebhookEventWhereInput[]
    NOT?: WebhookEventWhereInput | WebhookEventWhereInput[]
    eventType?: StringFilter<"WebhookEvent"> | string
    source?: StringFilter<"WebhookEvent"> | string
    payload?: JsonFilter<"WebhookEvent">
    headers?: JsonNullableFilter<"WebhookEvent">
    receivedAt?: DateTimeFilter<"WebhookEvent"> | Date | string
  }, "id">

  export type WebhookEventOrderByWithAggregationInput = {
    id?: SortOrder
    eventType?: SortOrder
    source?: SortOrder
    payload?: SortOrder
    headers?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
    _count?: WebhookEventCountOrderByAggregateInput
    _max?: WebhookEventMaxOrderByAggregateInput
    _min?: WebhookEventMinOrderByAggregateInput
  }

  export type WebhookEventScalarWhereWithAggregatesInput = {
    AND?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    OR?: WebhookEventScalarWhereWithAggregatesInput[]
    NOT?: WebhookEventScalarWhereWithAggregatesInput | WebhookEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WebhookEvent"> | string
    eventType?: StringWithAggregatesFilter<"WebhookEvent"> | string
    source?: StringWithAggregatesFilter<"WebhookEvent"> | string
    payload?: JsonWithAggregatesFilter<"WebhookEvent">
    headers?: JsonNullableWithAggregatesFilter<"WebhookEvent">
    receivedAt?: DateTimeWithAggregatesFilter<"WebhookEvent"> | Date | string
  }

  export type ApiCallCreateInput = {
    id?: string
    createdAt?: Date | string
    endpoint: string
    method: string
    source?: string
    templateName?: string | null
    transactionId?: string | null
    referenceNumber?: string | null
    requestHeaders: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus: number
    httpStatusText: string
    durationMs?: number | null
  }

  export type ApiCallUncheckedCreateInput = {
    id?: string
    createdAt?: Date | string
    endpoint: string
    method: string
    source?: string
    templateName?: string | null
    transactionId?: string | null
    referenceNumber?: string | null
    requestHeaders: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus: number
    httpStatusText: string
    durationMs?: number | null
  }

  export type ApiCallUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    templateName?: NullableStringFieldUpdateOperationsInput | string | null
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    requestHeaders?: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus?: IntFieldUpdateOperationsInput | number
    httpStatusText?: StringFieldUpdateOperationsInput | string
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ApiCallUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    templateName?: NullableStringFieldUpdateOperationsInput | string | null
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    requestHeaders?: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus?: IntFieldUpdateOperationsInput | number
    httpStatusText?: StringFieldUpdateOperationsInput | string
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ApiCallCreateManyInput = {
    id?: string
    createdAt?: Date | string
    endpoint: string
    method: string
    source?: string
    templateName?: string | null
    transactionId?: string | null
    referenceNumber?: string | null
    requestHeaders: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus: number
    httpStatusText: string
    durationMs?: number | null
  }

  export type ApiCallUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    templateName?: NullableStringFieldUpdateOperationsInput | string | null
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    requestHeaders?: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus?: IntFieldUpdateOperationsInput | number
    httpStatusText?: StringFieldUpdateOperationsInput | string
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type ApiCallUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    templateName?: NullableStringFieldUpdateOperationsInput | string | null
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    requestHeaders?: JsonNullValueInput | InputJsonValue
    requestBody?: NullableJsonNullValueInput | InputJsonValue
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    httpStatus?: IntFieldUpdateOperationsInput | number
    httpStatusText?: StringFieldUpdateOperationsInput | string
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type TransactionResponseCreateInput = {
    id?: string
    transactionId?: string | null
    referenceNum?: string | null
    endpoint: string
    method: string
    requestData: string
    responseData: string
    statusCode: number
    statusText: string
    duration?: number | null
    source: string
    createdAt?: Date | string
  }

  export type TransactionResponseUncheckedCreateInput = {
    id?: string
    transactionId?: string | null
    referenceNum?: string | null
    endpoint: string
    method: string
    requestData: string
    responseData: string
    statusCode: number
    statusText: string
    duration?: number | null
    source: string
    createdAt?: Date | string
  }

  export type TransactionResponseUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNum?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    requestData?: StringFieldUpdateOperationsInput | string
    responseData?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    statusText?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionResponseUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNum?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    requestData?: StringFieldUpdateOperationsInput | string
    responseData?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    statusText?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionResponseCreateManyInput = {
    id?: string
    transactionId?: string | null
    referenceNum?: string | null
    endpoint: string
    method: string
    requestData: string
    responseData: string
    statusCode: number
    statusText: string
    duration?: number | null
    source: string
    createdAt?: Date | string
  }

  export type TransactionResponseUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNum?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    requestData?: StringFieldUpdateOperationsInput | string
    responseData?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    statusText?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionResponseUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    transactionId?: NullableStringFieldUpdateOperationsInput | string | null
    referenceNum?: NullableStringFieldUpdateOperationsInput | string | null
    endpoint?: StringFieldUpdateOperationsInput | string
    method?: StringFieldUpdateOperationsInput | string
    requestData?: StringFieldUpdateOperationsInput | string
    responseData?: StringFieldUpdateOperationsInput | string
    statusCode?: IntFieldUpdateOperationsInput | number
    statusText?: StringFieldUpdateOperationsInput | string
    duration?: NullableIntFieldUpdateOperationsInput | number | null
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateInput = {
    id?: string
    eventType: string
    source: string
    payload: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: Date | string
  }

  export type WebhookEventUncheckedCreateInput = {
    id?: string
    eventType: string
    source: string
    payload: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: Date | string
  }

  export type WebhookEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventCreateManyInput = {
    id?: string
    eventType: string
    source: string
    payload: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: Date | string
  }

  export type WebhookEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    payload?: JsonNullValueInput | InputJsonValue
    headers?: NullableJsonNullValueInput | InputJsonValue
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ApiCallCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    source?: SortOrder
    templateName?: SortOrder
    transactionId?: SortOrder
    referenceNumber?: SortOrder
    requestHeaders?: SortOrder
    requestBody?: SortOrder
    responseBody?: SortOrder
    httpStatus?: SortOrder
    httpStatusText?: SortOrder
    durationMs?: SortOrder
  }

  export type ApiCallAvgOrderByAggregateInput = {
    httpStatus?: SortOrder
    durationMs?: SortOrder
  }

  export type ApiCallMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    source?: SortOrder
    templateName?: SortOrder
    transactionId?: SortOrder
    referenceNumber?: SortOrder
    httpStatus?: SortOrder
    httpStatusText?: SortOrder
    durationMs?: SortOrder
  }

  export type ApiCallMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    source?: SortOrder
    templateName?: SortOrder
    transactionId?: SortOrder
    referenceNumber?: SortOrder
    httpStatus?: SortOrder
    httpStatusText?: SortOrder
    durationMs?: SortOrder
  }

  export type ApiCallSumOrderByAggregateInput = {
    httpStatus?: SortOrder
    durationMs?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type TransactionResponseCountOrderByAggregateInput = {
    id?: SortOrder
    transactionId?: SortOrder
    referenceNum?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    requestData?: SortOrder
    responseData?: SortOrder
    statusCode?: SortOrder
    statusText?: SortOrder
    duration?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionResponseAvgOrderByAggregateInput = {
    statusCode?: SortOrder
    duration?: SortOrder
  }

  export type TransactionResponseMaxOrderByAggregateInput = {
    id?: SortOrder
    transactionId?: SortOrder
    referenceNum?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    requestData?: SortOrder
    responseData?: SortOrder
    statusCode?: SortOrder
    statusText?: SortOrder
    duration?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionResponseMinOrderByAggregateInput = {
    id?: SortOrder
    transactionId?: SortOrder
    referenceNum?: SortOrder
    endpoint?: SortOrder
    method?: SortOrder
    requestData?: SortOrder
    responseData?: SortOrder
    statusCode?: SortOrder
    statusText?: SortOrder
    duration?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionResponseSumOrderByAggregateInput = {
    statusCode?: SortOrder
    duration?: SortOrder
  }

  export type WebhookEventCountOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    source?: SortOrder
    payload?: SortOrder
    headers?: SortOrder
    receivedAt?: SortOrder
  }

  export type WebhookEventMaxOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    source?: SortOrder
    receivedAt?: SortOrder
  }

  export type WebhookEventMinOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    source?: SortOrder
    receivedAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
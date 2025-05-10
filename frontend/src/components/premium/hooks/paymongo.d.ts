interface PayMongoInstance {
  elements: () => {
    create: (
      type: string,
      options: any
    ) => {
      mount: (selector: string) => void;
    };
  };
  confirmPaymentIntent: (options: {
    id: string;
    client_key: string;
    return_url: string;
  }) => Promise<{
    error?: { message: string };
  }>;
}

interface PayMongoStatic {
  init: (publicKey: string) => PayMongoInstance;
}

declare global {
  interface Window {
    PayMongo: PayMongoStatic;
  }
}

export {};

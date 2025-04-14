export interface ShopItem {
  item_code: string;
  item_name: string;
  item_description: string;
  item_effect: string;
  item_price: number;
  item_picture_url: string;
}

export interface UserItem {
  firebase_uid: string;
  username: string;
  item_code: string;
  item_name: string;
  quantity: number;
}

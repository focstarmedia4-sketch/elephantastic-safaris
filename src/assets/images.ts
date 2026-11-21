// Production-safe image assets for Elephantastic Safaris
// Local images use static ES imports so Vite bundles them into dist/assets for Netlify deployment.

import safariToursImg from './images/safari_tour_card_1794323355207.jpg';
import hotelLodgeImg from './images/hotel_lodge_card_1794323356040.jpg';
import bnbVillaImg from './images/bnb_villa_card_1794323357592.jpg';
import blogMaraImg from './images/blog_mara_migration_1794325893622.jpg';
import blogMountKenyaImg from './images/blog_mount_kenya_peaks_1794325893931.jpg';
import blogBushCampImg from './images/blog_bush_camp_1794996241796.jpg';
import blogNyamaChomaImg from './images/blog_nyama_choma_1794996243727.jpg';
import blogKenyaGuidesImg from './images/blog_kenya_guides_1794996242266.jpg';
import blogHiddenGemsImg from './images/blog_hidden_gems_1794996922161.jpg';
import blogKenyanCultureImg from './images/blog_kenyan_culture_1794996923091.jpg';
import blogRomanticKenyaImg from './images/blog_romantic_kenya_1794996923892.jpg';
import blogRiftValleyImg from './images/blog_rift_valley_1794996921433.jpg';

export const IMAGES = {
  safariTours: safariToursImg,
  hotelLodge: hotelLodgeImg,
  bnbVilla: bnbVillaImg,
  blogMara: blogMaraImg,
  blogDiani:
    'https://zzsxyuojnkxfedjecfha.supabase.co/storage/v1/object/public/website%20direct%20uploads/manda-bay-kenya-aerial.jpg',
  blogMountKenya: blogMountKenyaImg,
  blogBushCamp: blogBushCampImg,
  blogNyamaChoma: blogNyamaChomaImg,
  blogKenyaGuides: blogKenyaGuidesImg,
  blogHiddenGems: blogHiddenGemsImg,
  blogKenyanCulture: blogKenyanCultureImg,
  blogRomanticKenya: blogRomanticKenyaImg,
  blogRiftValley: blogRiftValleyImg,
};

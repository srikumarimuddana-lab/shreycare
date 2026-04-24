import { NextRequest, NextResponse } from "next/server";
import { sanityWriteClient } from "@/lib/sanity/client";

function block(text: string, style = "normal") {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2, 10),
    style,
    children: [{ _type: "span", _key: "s1", text }],
  };
}

const posts = [
  {
    title: "How to Use Ayurvedic Hair Oil for Maximum Hair Growth",
    slug: "how-to-use-ayurvedic-hair-oil",
    excerpt:
      "A step-by-step guide to oiling your hair the Ayurvedic way for stronger, thicker, healthier hair. Covers warm oil massage techniques, how long to leave oil in, and the best oils for hair growth in Canada.",
    category: "hair-care",
    author: "ShreyCare Organics",
    body: [
      block("How to Use Ayurvedic Hair Oil for Maximum Hair Growth", "h2"),
      block(
        "Ayurvedic hair oiling is one of the oldest and most effective natural remedies for hair growth. In Canada, where cold winters and dry indoor heating damage hair, a regular oiling routine can transform your hair health. Here is a complete guide to doing it right.",
      ),
      block("What Is Ayurvedic Hair Oiling?", "h2"),
      block(
        "Ayurvedic hair oiling is the practice of massaging warm herbal oil into the scalp and hair. Traditional Ayurvedic texts recommend oils infused with herbs like bhringraj, amla, brahmi, and hibiscus — each chosen for specific benefits like reducing hair fall, promoting new growth, and conditioning dry scalp.",
      ),
      block("Step-by-Step: How to Apply Hair Oil", "h2"),
      block(
        "Step 1: Choose your oil. For hair growth, bhringraj oil is considered the gold standard in Ayurveda. Amla oil is best for adding shine and strength. A blend of both covers all bases.",
      ),
      block(
        "Step 2: Warm the oil. Pour 2-3 tablespoons into a small bowl and warm it gently. Never microwave — place the bowl in hot water for 30 seconds. The oil should be comfortably warm, not hot.",
      ),
      block(
        "Step 3: Section your hair. Part your hair into 4-6 sections using clips. This ensures the oil reaches your scalp, not just the surface of your hair.",
      ),
      block(
        "Step 4: Massage into the scalp. Using your fingertips (not nails), apply oil directly to the scalp along each part. Massage in circular motions for 5-10 minutes. This stimulates blood flow to the hair follicles.",
      ),
      block(
        "Step 5: Work through the lengths. Distribute remaining oil from mid-shaft to ends. Pay extra attention to dry or damaged tips.",
      ),
      block(
        "Step 6: Leave it in. For best results, leave the oil on for at least 30 minutes. Overnight is ideal — wrap your hair in a silk scarf or use a towel on your pillow.",
      ),
      block(
        "Step 7: Wash thoroughly. Use a gentle sulphate-free shampoo. You may need to lather twice to remove all the oil.",
      ),
      block("How Often Should You Oil Your Hair?", "h2"),
      block(
        "For most hair types, oiling 2-3 times per week delivers the best results. If you have an oily scalp, once a week is sufficient. Consistency matters more than frequency — a regular weekly routine outperforms sporadic heavy oiling.",
      ),
      block("Best Ayurvedic Oils for Hair Growth in Canada", "h2"),
      block(
        "Bhringraj oil: Known as the 'king of herbs' for hair, bhringraj promotes hair growth and reduces premature greying. It is the most recommended herb in Ayurvedic texts for hair health.",
      ),
      block(
        "Amla oil: Rich in vitamin C and antioxidants, amla strengthens hair from root to tip, adds natural shine, and helps prevent split ends.",
      ),
      block(
        "Brahmi oil: Calms the scalp, reduces dandruff, and nourishes hair follicles. Excellent for people with dry, flaky scalp — especially common in Canadian winters.",
      ),
      block(
        "Coconut oil base: Most Ayurvedic hair oils use cold-pressed coconut oil as the carrier. It penetrates the hair shaft deeper than any other oil, reducing protein loss.",
      ),
      block("Tips for Canadian Climates", "h2"),
      block(
        "Canadian winters are particularly harsh on hair. Indoor heating strips moisture, and cold air causes breakage. Ayurvedic hair oiling acts as a protective barrier. During winter months, consider oiling the night before every wash. In summer, a lighter application 30 minutes before washing is enough.",
      ),
      block(
        "ShreyCare Organics ships cold-pressed, organic ayurvedic hair oils across Canada. Our oils are formulated with traditional Ayurvedic herbs — bhringraj, amla, brahmi, and more — to give your hair the nourishment it needs year-round.",
      ),
    ],
  },
  {
    title: "Bhringraj Oil Benefits: The King of Ayurvedic Hair Herbs",
    slug: "bhringraj-oil-benefits",
    excerpt:
      "Bhringraj is called the 'king of herbs' for hair in Ayurveda. Learn what bhringraj oil does for hair growth, how it prevents hair loss, and why it is the most recommended Ayurvedic herb for hair health.",
    category: "ingredients",
    author: "ShreyCare Organics",
    body: [
      block("Bhringraj Oil Benefits: Why Ayurveda Calls It the King of Hair Herbs", "h2"),
      block(
        "If you have ever searched for natural remedies for hair loss, you have likely come across bhringraj. Known scientifically as Eclipta alba, bhringraj has been the cornerstone of Ayurvedic hair care for thousands of years. Here is everything you need to know about this powerful herb and why it deserves a place in your hair care routine.",
      ),
      block("What Is Bhringraj?", "h2"),
      block(
        "Bhringraj (Eclipta alba) is a small flowering herb native to India. In Ayurveda, it is classified as a 'Rasayana' — a rejuvenating herb. The name translates roughly to 'ruler of the hair,' and it has been used in traditional Indian medicine for centuries to promote hair growth, prevent premature greying, and maintain scalp health.",
      ),
      block("Proven Benefits of Bhringraj Oil for Hair", "h2"),
      block(
        "Promotes hair growth: Studies have shown that bhringraj extract can stimulate hair follicles and promote faster hair growth. A 2008 study published in the Journal of Ethnopharmacology found that Eclipta alba extract showed hair growth-promoting activity comparable to the pharmaceutical ingredient minoxidil.",
      ),
      block(
        "Reduces hair fall: Bhringraj strengthens hair roots and reduces breakage. Regular scalp massage with bhringraj oil improves blood circulation to the follicles, keeping them nourished and anchored.",
      ),
      block(
        "Prevents premature greying: One of bhringraj's most valued traditional uses is preventing grey hair. The herb contains natural pigments and antioxidants that help maintain your hair's natural colour.",
      ),
      block(
        "Treats dry scalp and dandruff: Bhringraj has anti-inflammatory and antimicrobial properties that soothe irritated scalp, reduce flaking, and control dandruff — a common issue during Canadian winters.",
      ),
      block(
        "Conditions and adds shine: The natural fatty acids in bhringraj oil deeply condition hair, reducing frizz and adding natural lustre without synthetic silicones.",
      ),
      block("How to Use Bhringraj Oil", "h2"),
      block(
        "For best results, warm 2-3 tablespoons of bhringraj oil and massage it into your scalp using circular motions. Leave it on for at least 30 minutes or overnight. Wash with a gentle shampoo. Use 2-3 times per week for noticeable results within 4-6 weeks.",
      ),
      block("Bhringraj vs Other Hair Oils", "h2"),
      block(
        "Bhringraj vs Rosemary oil: Both promote hair growth, but bhringraj has the added benefit of preventing greying and has a longer history of traditional use. Rosemary oil is better known in Western herbalism, while bhringraj is the Ayurvedic equivalent.",
      ),
      block(
        "Bhringraj vs Castor oil: Castor oil is thick and primarily adds moisture. Bhringraj is lighter and actively stimulates the hair follicles. Many people combine both for a comprehensive treatment.",
      ),
      block(
        "Bhringraj vs Minoxidil: While minoxidil is a pharmaceutical treatment with known side effects, bhringraj is a natural alternative that has shown comparable growth-promoting activity in studies, without the chemical concerns.",
      ),
      block("Where to Buy Bhringraj Oil in Canada", "h2"),
      block(
        "Authentic, cold-pressed bhringraj oil can be hard to find in Canada. Many mass-market products use synthetic fragrances and mineral oil bases. ShreyCare Organics offers pure, cold-pressed bhringraj hair oil made with traditional Ayurvedic methods and shipped across Canada. Our bhringraj oil uses a coconut oil base for maximum absorption and contains no synthetic additives.",
      ),
    ],
  },
  {
    title: "Best Hair Oil for Dry Scalp in Canada — A Complete Guide",
    slug: "best-hair-oil-for-dry-scalp-canada",
    excerpt:
      "Dry, flaky scalp is extremely common in Canada, especially during winter. Learn which natural hair oils work best for dry scalp, how to apply them, and how Ayurvedic herbs can restore your scalp health.",
    category: "hair-care",
    author: "ShreyCare Organics",
    body: [
      block("Best Hair Oil for Dry Scalp in Canada", "h2"),
      block(
        "If you live in Canada, you know the struggle: cold winters, dry indoor heating, and harsh winds that leave your scalp itchy, flaky, and uncomfortable. Dry scalp affects millions of Canadians, and while medicated shampoos offer temporary relief, natural hair oils address the root cause by restoring moisture and nourishing the skin.",
      ),
      block("Why Is Dry Scalp So Common in Canada?", "h2"),
      block(
        "Canadian winters create a perfect storm for scalp problems. Outside temperatures drop well below freezing, stripping moisture from your skin. Inside, forced-air heating further dries the air. The constant switch between cold outdoor air and warm dry indoor air disrupts your scalp's natural moisture balance. Add hot showers (which strip natural oils) and you have a recipe for chronic dryness.",
      ),
      block("Top Natural Oils for Dry Scalp", "h2"),
      block(
        "Coconut oil: The most researched hair oil. Cold-pressed coconut oil penetrates the hair shaft and scalp more effectively than any other oil. It has natural antimicrobial properties that help with dandruff. Use as an overnight scalp treatment.",
      ),
      block(
        "Brahmi oil: An Ayurvedic herb that calms inflammation, reduces itching, and deeply moisturizes the scalp. Brahmi is particularly effective for people whose dry scalp is accompanied by stress-related hair loss.",
      ),
      block(
        "Amla oil: Rich in vitamin C and essential fatty acids, amla oil nourishes dry scalp, reduces flaking, and strengthens hair roots. It also helps maintain the scalp's natural pH balance.",
      ),
      block(
        "Bhringraj oil: Beyond its hair growth benefits, bhringraj soothes irritated scalp and has anti-inflammatory properties that reduce redness and itching.",
      ),
      block(
        "Neem oil: A powerful antifungal and antibacterial herb. If your dry scalp is accompanied by dandruff (which is often fungal), neem oil can help address the underlying cause. Best used blended with a carrier oil like coconut.",
      ),
      block("How to Treat Dry Scalp with Hair Oil", "h2"),
      block(
        "Warm 2-3 tablespoons of oil. Part hair into sections. Apply oil directly to the scalp using your fingertips. Massage gently for 5-10 minutes. Cover with a warm towel or shower cap for 30 minutes to an hour. Wash with a sulphate-free shampoo. Repeat 2-3 times per week during winter, once a week in summer.",
      ),
      block("What to Avoid", "h2"),
      block(
        "Avoid hair oils with mineral oil or synthetic fragrances — these sit on top of the scalp without penetrating, and can actually worsen dryness. Avoid very hot water when washing, as it strips your natural oils. Avoid over-washing — every other day is sufficient for most people.",
      ),
      block("The Ayurvedic Approach to Scalp Health", "h2"),
      block(
        "In Ayurveda, dry scalp is associated with Vata imbalance — excess dryness and movement in the body. The remedy is warm, heavy, nourishing oils applied regularly. This is why Ayurvedic hair oils use a base of coconut or sesame oil infused with warming, moisturizing herbs. The ritual of warm oil massage itself is considered therapeutic, calming the nervous system and promoting better sleep.",
      ),
      block(
        "ShreyCare Organics formulates hair oils specifically designed for the challenges of the Canadian climate. Our cold-pressed oils combine traditional Ayurvedic herbs — brahmi, amla, bhringraj, and neem — in a coconut oil base for maximum scalp penetration and moisture restoration. Shipped across Canada.",
      ),
    ],
  },
  {
    title: "Amla vs Argan Oil for Hair: Which Is Better?",
    slug: "amla-vs-argan-oil-for-hair",
    excerpt:
      "Amla and argan oil are both popular for hair care, but they work very differently. Compare benefits, best uses, and which one is right for your hair type. A Canadian buyer's perspective.",
    category: "ingredients",
    author: "ShreyCare Organics",
    body: [
      block("Amla vs Argan Oil: Which Is Better for Your Hair?", "h2"),
      block(
        "Two of the most popular natural hair oils in Canada right now are amla oil and argan oil. Both promise healthier, shinier hair — but they come from completely different traditions and work in different ways. This guide breaks down the differences so you can choose the right one for your hair.",
      ),
      block("What Is Amla Oil?", "h2"),
      block(
        "Amla (Emblica officinalis), also known as Indian gooseberry, is one of the most important herbs in Ayurvedic medicine. The fruit is extraordinarily rich in vitamin C — containing up to 20 times more than an orange. Amla oil is made by infusing dried amla fruit in a carrier oil (traditionally coconut or sesame oil), which extracts the nutrients into a form that can penetrate the hair and scalp.",
      ),
      block("What Is Argan Oil?", "h2"),
      block(
        "Argan oil comes from the kernels of the argan tree, native to Morocco. It is rich in vitamin E, essential fatty acids, and antioxidants. Argan oil became popular in Western beauty in the 2010s and is now widely available in Canada. Most argan oil is cold-pressed from the raw kernels.",
      ),
      block("Head-to-Head Comparison", "h2"),
      block(
        "Hair growth: Amla wins. Amla oil has been shown to stimulate hair follicles, promote new growth, and reduce hair fall. Argan oil nourishes existing hair but does not actively stimulate growth at the follicle level.",
      ),
      block(
        "Shine and smoothness: Argan wins slightly. Argan oil excels at taming frizz, adding instant shine, and making hair feel silky. It works particularly well as a leave-in finishing oil.",
      ),
      block(
        "Scalp health: Amla wins. Amla's vitamin C content and natural acidity help maintain scalp pH, reduce dandruff, and prevent bacterial buildup. Argan oil moisturizes the scalp but lacks amla's antimicrobial properties.",
      ),
      block(
        "Preventing grey hair: Amla wins decisively. Amla is one of the few natural ingredients with a traditional reputation for preventing premature greying, backed by its high antioxidant content. Argan oil does not address greying.",
      ),
      block(
        "Ease of use: Argan wins. Argan oil is lightweight, non-greasy, and can be used as a leave-in product. Amla oil is heavier and typically needs to be washed out, making it more of a treatment than a styling product.",
      ),
      block(
        "Price in Canada: Argan is more expensive. Pure argan oil typically costs $25-40 CAD for 100ml. Quality amla oil is generally $15-25 CAD for a similar size. However, both are susceptible to adulteration — always look for cold-pressed, organic products from trusted brands.",
      ),
      block("The Verdict: Use Both", "h2"),
      block(
        "The best approach for most people is to use amla oil as a pre-wash scalp treatment (for growth, strength, and scalp health) and argan oil as a post-wash finishing oil (for shine and frizz control). They complement each other perfectly because they address different needs.",
      ),
      block(
        "If you can only choose one: pick amla oil if your priority is hair growth, reducing hair fall, or preventing greying. Pick argan oil if your priority is immediate smoothness and frizz control on otherwise healthy hair.",
      ),
      block(
        "ShreyCare Organics uses cold-pressed amla as a core ingredient in our Ayurvedic hair oils, combined with bhringraj and brahmi for a comprehensive treatment that covers growth, strength, and scalp health. Available across Canada.",
      ),
    ],
  },
  {
    title: "How Often Should You Oil Your Hair? The Complete Guide",
    slug: "how-often-should-you-oil-your-hair",
    excerpt:
      "Is daily hair oiling too much? Is once a week enough? Learn the ideal hair oiling frequency for your hair type, plus tips for the Canadian climate where dry winters and indoor heating affect your hair.",
    category: "rituals",
    author: "ShreyCare Organics",
    body: [
      block("How Often Should You Oil Your Hair?", "h2"),
      block(
        "One of the most common questions we get at ShreyCare Organics is: how often should I oil my hair? The answer depends on your hair type, scalp condition, and lifestyle — but there are clear guidelines from Ayurvedic tradition and modern hair science that can help you find the right rhythm.",
      ),
      block("The Short Answer", "h2"),
      block(
        "For most people: 2-3 times per week is ideal. This gives your scalp consistent nourishment without over-saturating your hair with oil. However, the right frequency varies by hair type.",
      ),
      block("Oiling Frequency by Hair Type", "h2"),
      block(
        "Dry hair and scalp: Oil 3 times per week, or even daily during harsh Canadian winters. Dry hair drinks up oil and benefits from frequent application. Focus on the scalp and dry ends.",
      ),
      block(
        "Normal hair: 2 times per week is the sweet spot. A midweek treatment and a weekend overnight session works well for most people.",
      ),
      block(
        "Oily scalp: Once a week is enough. Focus the oil on your scalp only (not the lengths), leave it on for 30 minutes maximum, and wash thoroughly. Over-oiling an already oily scalp can clog follicles.",
      ),
      block(
        "Fine or thin hair: Once a week, using a light touch. Use less oil (1 tablespoon instead of 2-3) and choose lighter oils like bhringraj in a coconut base rather than heavy castor oil.",
      ),
      block(
        "Thick or coarse hair: 2-3 times per week. Thick hair can handle more oil and benefits from deep conditioning. Overnight treatments work particularly well.",
      ),
      block(
        "Colour-treated hair: Once a week. Oil helps protect colour-treated hair from further damage, but over-oiling can strip colour faster. Use gentle, cold-pressed oils without mineral oil.",
      ),
      block("Canadian Climate Adjustments", "h2"),
      block(
        "In winter (October to April): Increase your oiling frequency by one session per week. The combination of freezing outdoor air and dry indoor heating is extremely harsh on hair. An extra oiling session acts as a moisture barrier.",
      ),
      block(
        "In summer (May to September): Reduce slightly if your scalp gets oily in the humidity. A lighter application for 30 minutes before washing is sufficient.",
      ),
      block(
        "Year-round tip: If you swim regularly (chlorinated pools are common in Canadian fitness culture), always oil your hair before swimming. The oil creates a protective layer that prevents chlorine from stripping your hair.",
      ),
      block("Common Mistakes to Avoid", "h2"),
      block(
        "Over-oiling: More oil does not mean more benefits. Using too much oil clogs pores, attracts dirt, and makes washing difficult. Two to three tablespoons is enough for most hair lengths.",
      ),
      block(
        "Not washing thoroughly: Leftover oil in your hair attracts dust and can make hair look greasy. Shampoo twice if needed, or use a gentle clarifying rinse.",
      ),
      block(
        "Using cold oil: Always warm your oil before applying. Warm oil penetrates the scalp and hair shaft far more effectively than room-temperature oil. Place the oil container in hot water for 30 seconds.",
      ),
      block(
        "Skipping the massage: The massage is just as important as the oil itself. Five to ten minutes of circular scalp massage stimulates blood flow to the follicles, which is what drives new hair growth.",
      ),
      block("The Bottom Line", "h2"),
      block(
        "Start with twice a week and adjust based on how your hair responds. If your scalp feels dry between sessions, add one more. If your hair feels heavy or greasy, reduce to once a week. Consistency is more important than frequency — a regular routine always beats sporadic heavy treatments.",
      ),
      block(
        "ShreyCare Organics cold-pressed ayurvedic hair oils are designed for regular use. Our formulas absorb quickly, wash out cleanly, and deliver the herbs your scalp needs — bhringraj for growth, amla for strength, brahmi for moisture. Shipped across Canada.",
      ),
    ],
  },
];

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }

  const authorized =
    req.headers.get("x-admin-secret") === secret ||
    req.cookies.get("admin_secret")?.value === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { title: string; status: string }[] = [];

  for (const post of posts) {
    try {
      await sanityWriteClient.create({
        _type: "blogPost",
        title: post.title,
        slug: { _type: "slug", current: post.slug },
        excerpt: post.excerpt,
        body: post.body,
        category: post.category,
        author: post.author,
        publishedAt: new Date().toISOString(),
      });
      results.push({ title: post.title, status: "created" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      results.push({ title: post.title, status: `failed: ${msg}` });
    }
  }

  return NextResponse.json({ results });
}

import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";
import Groq from "groq-sdk";

const http = httpRouter();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
    }

    const svix_id = request.headers.get("svix-id");
    const svix_signature = request.headers.get("svix-signature");
    const svix_timestamp = request.headers.get("svix-timestamp");

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    if (eventType === "user.created") {
      const { id, first_name, last_name, image_url, email_addresses } = evt.data;

      const email = email_addresses[0].email_address;

      const name = `${first_name || ""} ${last_name || ""}`.trim();

      try {
        await ctx.runMutation(api.users.syncUser, {
          email,
          name,
          image: image_url,
          clerkId: id,
        });
      } catch (error) {
        console.log("Error creating user:", error);
        return new Response("Error creating user", { status: 500 });
      }
    }   

    return new Response("Webhooks processed successfully", { status: 200 });
  }),
});


// --- ROBUST VALIDATION HELPERS ---
function validateWorkoutPlan(plan: any) {
  return {
    schedule: Array.isArray(plan.schedule) && plan.schedule.length > 0 
      ? plan.schedule 
      : ["Monday", "Wednesday", "Friday"], // Fallback schedule
    exercises: (plan.exercises || []).map((ex: any) => ({
      day: String(ex.day || "Workout Day"),
      routines: (ex.routines || []).map((r: any) => ({
        name: String(r.name || "Strength Exercise"),
        sets: Number(r.sets) || 3,
        reps: Number(r.reps) || 10,
        duration: r.duration ? String(r.duration) : undefined,
        description: r.description ? String(r.description) : undefined,
      })),
    })),
  };
}

function validateDietPlan(plan: any) {
  return {
    dailyCalories: Number(plan.dailyCalories) || 2200,
    meals: (plan.meals || []).map((m: any) => ({
      name: String(m.name || "Meal"),
      foods: Array.isArray(m.foods) && m.foods.length > 0 
        ? m.foods.map(String) 
        : ["Healthy Protein", "Vegetables", "Complex Carbs"], // Fallback foods
    })),
  };
}

// --- HTTP ROUTE ---
http.route({
  path: "/vapi/generate-program",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = request.headers.get("x-vapi-secret");
    const correctSecret = process.env.VAPI_SECRET;
    
    if (correctSecret && secret !== correctSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      const payload = await request.json();
      
      let args: any;
      if (payload.message?.toolCalls) {
        const toolCall = payload.message.toolCalls[0];
        args = typeof toolCall.function.arguments === "string" 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
      } else {
        args = payload;
      }

      // 1. EXTRACT DATA WITH DEFAULTS TO PREVENT AI CONFUSION
      // const userId = String(args.user_id || "guest_user"); 
      const userId = args.user_id;

     if (!userId) {
       console.error("CRITICAL: No user_id received from Vapi. Check frontend vapi.start variables.");
       return new Response("Missing user_id", { status: 400 });
         }
      const goal = args.fitness_goal || "general fitness";
      const days = args.workout_days || 3;
      const age = args.age || 25;
      const level = args.fitness_level || "beginner";
      const restrictions = args.dietary_restrictions || "none";

      console.log(`Generating detailed plan for ${userId}...`);

      // 2. GENERATE WORKOUT WITH ONE-SHOT PROMPTING
      const workoutCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional fitness coach. Return ONLY valid JSON. No conversational text." },
          { role: "user", content: `Create a ${days}-day workout plan for a ${age}yo ${level} focused on ${goal}. 
            REQUIRED JSON FORMAT:
            {
              "schedule": ["Monday", "Wednesday", "Friday"],
              "exercises": [
                { "day": "Monday", "routines": [{"name": "Squats", "sets": 3, "reps": 12}] }
              ]
            }` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5, // Slightly higher for more creative exercise selection
      });

      // 3. GENERATE DIET WITH ONE-SHOT PROMPTING
      const dietCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional nutritionist. Return ONLY valid JSON." },
          { role: "user", content: `Create a diet plan for goal: ${goal} with restrictions: ${restrictions}.
            REQUIRED JSON FORMAT:
            {
              "dailyCalories": 2400,
              "meals": [
                { "name": "Breakfast", "foods": ["Oatmeal", "Egg whites"] }
              ]
            }` 
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const workoutPlan = validateWorkoutPlan(JSON.parse(workoutCompletion.choices[0].message.content || "{}"));
      const dietPlan = validateDietPlan(JSON.parse(dietCompletion.choices[0].message.content || "{}"));

      // 4. SAVE TO DATABASE
      const planId = await ctx.runMutation(api.plans.createPlan, {
        userId,
        dietPlan,
        workoutPlan,
        isActive: true,
        name: `${goal} Plan`,
      });

      return new Response(
        JSON.stringify({
          results: [{
            toolCallId: payload.message?.toolCalls?.[0]?.id,
            result: `Successfully generated and saved plan ${planId}.`
          }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } catch (error: any) {
      console.error("CRITICAL ERROR:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }),
});

export default http;



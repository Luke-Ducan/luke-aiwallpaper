import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const BASE_URL = "https://api.zhiqite.com";
const ACCESS_KEY_ID = process.env.ZHIQITE_KEY_ID!;
const ACCESS_KEY_SECRET = process.env.ZHIQITE_KEY_SECRET!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const R2_BUCKET_ENDPOINT = process.env.R2_BUCKET_ENDPOINT!;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Payload for generating the image
    const payload = {
      prompt,
      n_iter: 1,
      batch_size: 1,
      steps: 25,
      seed: "-1",
      restore_faces: false,
      enable_hr: false,
      hr_scale: 2,
      width: 768,
      height: 768,
      negative_prompt:
        "(nsfw:1.5),(nude:1.3), (child Pornography:1.2),molestation,incest,rape,about to be raped,(sex:1.3),uncensored,EasyNegative,(worst quality, low quality:1.4), (((distorted hands))),((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((b&w)), (((duplicate))), ((morbid)), ((mutilated)),poorly drawn face, out of frame, mutation, mutated, (text), signature, monster,watermark,extra fingers,fewer fingers, Wrong hands,wrong fingers,fingers crossed,styled fingers,fingers missed,missed fingers,cheese fingers, chocolate fingers,fingers on fingers,closed fist, fighting fist,fist ,hands with fist,many fists,only hands with wrong fists,fingers crossed,",
      cfg_scale: 7,
      sampler_index: "DPM++ 2M Karras",
      hr_second_pass_steps: 20,
      hr_resize_x: 1024,
      hr_resize_y: 1024,
      denoising_strength: 0.55,
      alwayson_scripts: {
        sd_model_checkpoint: "revAnimated_v122_7371.safetensors",
        id_task: "pro1686666",
        sd_vae: "vae-ft-mse-840000-ema-pruned.ckpt",
        override_settings: {
          CLIP_stop_at_last_layers: 2,
        },
      },
    };

    // Call the API to generate the image
    const response = await axios.post(
      `${BASE_URL}/AIGCImgOpenServ/saas/sd/v2/text2image`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Request-req-accessKeyId": ACCESS_KEY_ID,
          "X-Request-req-accessKeySecret": ACCESS_KEY_SECRET,
        },
        timeout: 60000, // 设置超时时间为 60 秒
      }
    );

    if (response.data.code === "200" && response.data.data?.task_id) {
      const taskId = response.data.data.task_id;

      // Query the task status and get the image URL
      const imageUrl = await queryTaskInfo(taskId);

      // Upload the image to Cloudflare R2
      const r2Key = `${Date.now()}-${taskId}.png`;
      const uploadedUrl = await uploadToR2(imageUrl, r2Key);

      // Return the R2 public URL for the image
      return NextResponse.json({ prompt, imageUrl: uploadedUrl });
    } else {
      return NextResponse.json(
        { error: "API request failed", details: response.data },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error:", error?.response?.data || error.message || error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.response?.data || error.message || error },
      { status: 500 }
    );
  }
}

// Function to query task status
async function queryTaskInfo(taskId: string, retries = 5, delayMs = 10000): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.post(
        `${BASE_URL}/AIGCImgOpenServ/saas/sd/v2/queryTaskInfo`,
        { businessTaskId: taskId },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Request-req-accessKeyId": ACCESS_KEY_ID,
            "X-Request-req-accessKeySecret": ACCESS_KEY_SECRET,
          },
          timeout: 60000, // 设置超时时间为 60 秒
        }
      );

      const data = response.data;
      if (data.code === "200" && data.data?.status === 2) {
        if (data.data.differentialImageRspList?.length > 0) {
          return data.data.differentialImageRspList[0].image_url;
        } else {
          throw new Error("No image URL found in response");
        }
      } else if (data.data?.status === 1 || data.data?.status === 3) {
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw new Error("Task failed or unknown status");
      }
    } catch (error) {
      if (attempt === retries - 1) {
        throw error;
      }
      console.warn(`Retrying queryTaskInfo... Attempt ${attempt + 1}`);
    }
  }
  throw new Error("Task not completed or image not generated");
}

// Function to upload image to Cloudflare R2
async function uploadToR2(imageUrl: string, key: string): Promise<string> {
  const s3 = new S3Client({
    region: "auto",
    endpoint: R2_BUCKET_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  // Fetch image data
  const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });
  const imageData = imageResponse.data;

  // Upload to R2
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: imageData,
      ContentType: "image/png",
    })
  );

  // Return the public URL for the uploaded image
  return `${R2_PUBLIC_URL}/${key}`;
}

import SMS_CONFIG from "../const/sms";

const DEFAULT_API_URL = "https://api.sms.ir/v1/send/verify";
const REQUEST_TIMEOUT_MS = 10_000;

interface SendOtpInput {
  phoneNumber: string;
  code: string;
  expiresInMinutes: number;
}

interface SmsIrResponse {
  status?: number;
  message?: string;
  data?: unknown;
}

export class SmsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmsServiceError";
  }
}

const toEnglishDigits = (value: string): string =>
  value
    .replace(/[\u06F0-\u06F9]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x06f0),
    )
    .replace(/[\u0660-\u0669]/g, (digit) =>
      String(digit.charCodeAt(0) - 0x0660),
    );

const normalizeIranianMobile = (input: string): string => {
  let phoneNumber = toEnglishDigits(input).replace(/[\s()-]/g, "");

  if (phoneNumber.startsWith("+98")) {
    phoneNumber = `0${phoneNumber.slice(3)}`;
  } else if (phoneNumber.startsWith("0098")) {
    phoneNumber = `0${phoneNumber.slice(4)}`;
  } else if (phoneNumber.startsWith("98")) {
    phoneNumber = `0${phoneNumber.slice(2)}`;
  }

  if (!/^09\d{9}$/.test(phoneNumber)) {
    throw new SmsServiceError("Invalid Iranian mobile number");
  }

  return phoneNumber;
};

class SmsService {
  async sendOtp({
    phoneNumber,
    code,
    expiresInMinutes,
  }: SendOtpInput): Promise<void> {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
      throw new SmsServiceError("SMS_API_KEY is not configured");
    }

    if (!code.trim()) {
      throw new SmsServiceError("OTP code cannot be empty");
    }

    if (!Number.isInteger(expiresInMinutes) || expiresInMinutes <= 0) {
      throw new SmsServiceError(
        "OTP expiration must be a positive number of minutes",
      );
    }

    const mobile = normalizeIranianMobile(phoneNumber);
    const templateId = Number(
      process.env.SMS_AUTH_TEMPLATE_ID ?? SMS_CONFIG.authTemplateId,
    );
    if (!Number.isInteger(templateId) || templateId <= 0) {
      throw new SmsServiceError("SMS authentication template ID is invalid");
    }

    const endpoint = process.env.SMS_API_URL ?? DEFAULT_API_URL;
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          mobile,
          templateId,
          parameters: [
            {
              name: process.env.SMS_OTP_CODE_PARAMETER_NAME ?? "CODE",
              value: code,
            },
            {
              name: process.env.SMS_OTP_TIME_PARAMETER_NAME ?? "TIME",
              value: String(expiresInMinutes),
            },
          ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new SmsServiceError(
        error instanceof Error && error.name === "TimeoutError"
          ? "SMS provider request timed out"
          : "Could not connect to SMS provider",
      );
    }

    let result: SmsIrResponse | undefined;
    try {
      result = (await response.json()) as SmsIrResponse;
    } catch {
      // Some gateway errors return an empty or non-JSON response.
    }

    if (!response.ok || Number(result?.status) !== 1) {
      const reason = result?.message
        ? `: ${result.message}`
        : ` (HTTP ${response.status})`;
      throw new SmsServiceError(`SMS provider rejected the request${reason}`);
    }
  }
}

const smsService = new SmsService();

export default smsService;

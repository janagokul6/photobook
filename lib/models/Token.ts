import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IToken extends Document {
  provider: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: Date;
  updatedAt: Date;
}

const TokenSchema: Schema = new Schema({
  provider: {
    type: String,
    required: true,
    enum: ['google', 'googledrive', 'googlephotos', 'dropbox'], // 'onedrive' removed
    default: 'google'
  },
  refreshToken: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one token per provider exists
TokenSchema.index({ provider: 1 }, { unique: true });

TokenSchema.statics.getToken = async function (provider: string = 'googledrive'): Promise<IToken | null> {
  return this.findOne({ provider });
};

TokenSchema.statics.updateToken = async function (
  provider: string,
  refreshToken: string,
  accessToken: string,
  expiresIn: number
): Promise<IToken> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const token = await this.findOne({ provider });

  if (token) {
    token.refreshToken = refreshToken;
    token.accessToken = accessToken;
    token.expiresAt = expiresAt;
    token.updatedAt = new Date();
    return token.save();
  } else {
    return this.create({
      provider,
      refreshToken,
      accessToken,
      expiresAt,
    });
  }
};

export interface ITokenModel extends Model<IToken> {
  getToken(provider?: string): Promise<IToken | null>;
  updateToken(provider: string, refreshToken: string, accessToken: string, expiresIn: number): Promise<IToken>;
}

export default (mongoose.models.Token as ITokenModel) || mongoose.model<IToken, ITokenModel>('Token', TokenSchema);


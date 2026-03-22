import { NextResponse } from 'next/server';
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SCOPE = process.env.NEXT_PUBLIC_SELF_SCOPE || 'avaveil';
const MOCK_PASSPORT = process.env.NEXT_PUBLIC_SELF_MOCK_PASSPORT === 'true';

// Permissive config — campaign-specific requirements are enforced via QR disclosures
const selfBackendVerifier = new SelfBackendVerifier(
  SCOPE,
  `${APP_URL}/api/verify-self`,
  MOCK_PASSPORT,
  AllIds,
  new DefaultConfigStore({
    minimumAge: 0,
    excludedCountries: [],
    ofac: false,
  }),
  'hex'
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attestationId, proof, publicSignals, userContextData } = body;

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        { message: 'Proof, publicSignals, attestationId and userContextData are required' },
        { status: 400 }
      );
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    if (result.isValidDetails.isValid) {
      return NextResponse.json({
        status: 'success',
        result: true,
        credentialSubject: result.discloseOutput,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        result: false,
        reason: 'Verification failed',
        details: result.isValidDetails,
      });
    }
  } catch (error) {
    console.error('[verify-self]', error);
    return NextResponse.json({
      status: 'error',
      result: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

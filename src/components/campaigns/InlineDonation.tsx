import { useState } from 'react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Typography,
  Unstable_Grid2 as Grid2,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { lighten } from '@mui/material/styles'
import { Favorite, Info } from '@mui/icons-material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'

import { CampaignResponse } from 'gql/campaigns'
import { baseUrl, routes } from 'common/routes'
import { moneyPublic } from 'common/util/money'
import { useCampaignDonationHistory } from 'common/hooks/campaigns'
import theme from 'common/theme'
import { useCopyToClipboard } from 'common/util/useCopyToClipboard'
import useMobile from 'common/hooks/useMobile'

import LinkButton from '../common/LinkButton'
import CampaignProgress from './CampaignProgress'
import DonorsAndDonations from './DonorsAndDonations'
import { CampaignState } from './helpers/campaign.enums'
import MoneyFormatted from './MoneyFormatted'

const PREFIX = 'InlineDonation'

const classes = {
  inlineDonationWrapper: `${PREFIX}-inlineDonationWrapper`,
  reachedMoney: `${PREFIX}-reachedMoney`,
  targetMoney: `${PREFIX}-targetMoney`,
  donorsSharesCount: `${PREFIX}-donorsSharesCount`,
  donationPriceList: `${PREFIX}-donationPriceList`,
  dropdownLinkButton: `${PREFIX}-dropdownLinkButton`,
  dropdownLinkText: `${PREFIX}-dropdownLinkText`,
  buttonContainer: `${PREFIX}-buttonContainer`,
  sharesContainer: `${PREFIX}-sharesContainer`,
  openButton: `${PREFIX}-openButton`,
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`&.${classes.inlineDonationWrapper}`]: {
    backgroundColor: '#EEEEEE',
    borderRadius: theme.spacing(1),
    height: 'fit-content',
    boxShadow: '2px 4px 5px rgba(0, 0, 0, 0.25)',
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(0),
      borderRadius: theme.spacing(0),
    },
  },

  [`& .${classes.reachedMoney}`]: {
    fontSize: theme.spacing(5),
    fontWeight: 500,
    [theme.breakpoints.down('md')]: {
      fontSize: theme.spacing(3),
    },
  },

  [`& .${classes.targetMoney}`]: {
    fontSize: theme.spacing(3),
    [theme.breakpoints.down('md')]: {
      fontSize: theme.spacing(2),
    },
  },

  [`& .${classes.donorsSharesCount}`]: {
    fontWeight: 'bold',
    fontSize: theme.spacing(2),
  },

  [`& .${classes.donationPriceList}`]: {
    display: 'contents',
    textAlignLast: 'center',
  },

  [`& .${classes.dropdownLinkButton}`]: {
    '&:hover': {
      backgroundColor: lighten(theme.palette.primary.main, 0.9),
    },
  },

  [`& .${classes.dropdownLinkText}`]: {
    color: theme.palette.primary.dark,
    width: '100%',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },

  [`& .${classes.buttonContainer}`]: {
    [theme.breakpoints.down('md')]: {
      display: 'flex',
      flexWrap: 'nowrap',
      marginTop: theme.spacing(2),
    },
  },

  [`& .${classes.sharesContainer}`]: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },

  [`& .${classes.openButton}`]: {
    textAlign: 'center',
    marginBottom: `-${theme.spacing(7)}`,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#EEEEEE',
    minWidth: theme.spacing(5),
    paddingBottom: 'unset',
  },
}))

type Props = {
  campaign: CampaignResponse
}

export default function InlineDonation({ campaign }: Props) {
  const { t } = useTranslation()
  const { asPath } = useRouter()
  const [status, copyUrl] = useCopyToClipboard(baseUrl + asPath, 1000)
  const active = status === 'copied' ? 'inherit' : 'primary'
  const [page, setPage] = useState<number>(0)
  const pageSize = 5

  const {
    id: campaignId,
    targetAmount: target,
    summary,
    currency,
    allowDonationOnComplete,
    state: campaignState,
    slug: campaignSlug,
  } = campaign

  const reached = summary?.reachedAmount ?? 0
  const donors = summary?.donors ?? 0
  const {
    data: { items: donations, total: all_rows } = { items: [] },
    error: donationHistoryError,
    isLoading: isDonationHistoryLoading,
  } = useCampaignDonationHistory(campaignId, page, pageSize)
  const { mobile } = useMobile()
  const [isOpen, setIsOpen] = useState(false)
  const rowCount = page * pageSize + donations.length
  const detailsShown = isOpen || !mobile

  return (
    <StyledGrid item xs={12} mt={5} p={3} className={classes.inlineDonationWrapper}>
      <Grid2 mb={1} display="flex" justifyContent="space-between">
        <MoneyFormatted money={reached} currency={currency} />
        <MoneyFormatted money={target} currency={currency} />
      </Grid2>
      <CampaignProgress raised={reached} target={target} />
      <Grid container gap={1} className={classes.buttonContainer}>
        <Grid item xs={12}>
          <LinkButton
            fullWidth
            href={routes.campaigns.oneTimeDonation(campaignSlug)}
            disabled={campaignState === CampaignState.complete && !allowDonationOnComplete}
            variant="contained"
            color="secondary"
            startIcon={<Favorite color="action" />}>
            {t('common:support')}
          </LinkButton>
        </Grid>
        <Box display="flex">
          <Info color="warning" sx={{ fontSize: '1rem', mr: 1 }} />
          <Typography fontSize="0.7rem">
            Подкрепи.бг работи с 0% комисиона. Единствено се заплащат банкови такси, които изрично
            се упоменават преди да направите дарението си.
          </Typography>
        </Box>
      </Grid>
      {detailsShown && (
        <Typography className={classes.donorsSharesCount}>
          {donors} {t('campaigns:campaign.donors')}
        </Typography>
      )}
      {detailsShown &&
        (donationHistoryError ? (
          'Error fetching donation history'
        ) : isDonationHistoryLoading ? (
          <CircularProgress sx={{ display: 'block', margin: `${theme.spacing(3)} auto` }} />
        ) : (
          <>
            <DonorsAndDonations donations={donations} />
            {donations && donations.length !== 0 ? (
              <Grid container justifyContent="flex-end">
                <Typography m={1}>{`${page * pageSize + 1}-${rowCount}  ${t(
                  'campaigns:of',
                )}  ${all_rows}`}</Typography>
                <IconButton
                  aria-label="back"
                  disabled={page == 0}
                  onClick={() => setPage((index) => index - 1)}>
                  <ArrowBackIosIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="next"
                  disabled={rowCount == all_rows}
                  onClick={() => setPage((index) => index + 1)}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Grid>
            ) : null}
          </>
        ))}
      {/* <pre>{JSON.stringify(prices, null, 2)}</pre> */}
      {mobile && (
        <Grid textAlign="center">
          <Button variant="text" onClick={() => setIsOpen(!isOpen)} className={classes.openButton}>
            {isOpen ? <ExpandLessIcon fontSize="large" /> : <ExpandMoreIcon fontSize="large" />}
          </Button>
        </Grid>
      )}
    </StyledGrid>
  )
}

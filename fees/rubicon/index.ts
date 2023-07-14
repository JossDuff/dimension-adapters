import { Adapter, ChainEndpoints } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { request, gql } from "graphql-request";
import { getTimestampAtStartOfDayUTC } from "../../utils/date";

const endpoints: ChainEndpoints = {
  [CHAIN.OPTIMISM]: "https://api.thegraph.com/subgraphs/name/denverbaumgartner/rubiconmetricsoptimism",
  [CHAIN.ARBITRUM]: "https://api.thegraph.com/subgraphs/name/jossduff/rubiconmetricsarbitrum"
}

const graphs = (graphUrls: ChainEndpoints) => {
    return (chain: string) => {
        return async (timestamp: number) => {
            // divide by 24 hours to get day number, used as id in query
            const searchTimestamp = getTimestampAtStartOfDayUTC(timestamp) / 86400

            const graphQueryDailyFees = gql `{
                dayMakerRebateVolume(id: ${searchTimestamp}) {
                    rebate_volume_usd
                }
            }`;

            const graphQueryTotalFees = gql `{
                rubicons {
                    total_maker_rebate_volume_usd
                }
            }`;

            const graphResTotalFees = await request(graphUrls[chain], graphQueryTotalFees);
            const graphResDailyFees = await request(graphUrls[chain], graphQueryDailyFees);

            const totalFees = graphResTotalFees.rubicons[0]?.total_maker_rebate_volume_usd
                ? parseFloat(graphResTotalFees.rubicons[0].total_maker_rebate_volume_usd)
                : 0;

            const dailyFee = graphResDailyFees.dayMakerRebateVolume?.rebate_volume_usd
                ? parseFloat(graphResDailyFees.dayMakerRebateVolume.rebate_volume_usd)
                : 0;

            return {
                timestamp,
                totalFees: totalFees.toString(),
                dailyFees: dailyFee.toString(),
            };
        };
    };
};
const methodology = { Fees: "Fees paid to market makers." }

const adapter: Adapter = {
    adapter: {
        [CHAIN.ARBITRUM]: {
            fetch: graphs(endpoints)(CHAIN.ARBITRUM),
            start: async () => 1686345120,
            meta: {
                methodology,
            },
        },
        [CHAIN.OPTIMISM]: {
            fetch: graphs(endpoints)(CHAIN.OPTIMISM),
            start: async () => 1637020800,
            meta: {
                methodology,
            },
        }
    },
  };


export default adapter;